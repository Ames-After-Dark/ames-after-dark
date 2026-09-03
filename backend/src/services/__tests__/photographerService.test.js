const mockPrisma = {
    photo_albums: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
    },
    photographer_links: {
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
    },
    users: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
    },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
}));

const photographerService = require('../photographerService');

describe('photographerService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('recordAlbumIfNew', () => {
        test('creates a photo_albums row when none exists yet', async () => {
            mockPrisma.photo_albums.findUnique.mockResolvedValue(null);
            const created = { id: 1, folder_name: 'Outlaws 09-06', location_id: 9, photographer_id: 87 };
            mockPrisma.photo_albums.create.mockResolvedValue(created);

            const result = await photographerService.recordAlbumIfNew({
                folderName: 'Outlaws 09-06',
                locationId: 9,
                photographerId: 87,
            });

            expect(mockPrisma.photo_albums.create).toHaveBeenCalledWith({
                data: { folder_name: 'Outlaws 09-06', location_id: 9, photographer_id: 87 },
            });
            expect(result).toBe(created);
        });

        test('does nothing when a row already exists for that folder', async () => {
            mockPrisma.photo_albums.findUnique.mockResolvedValue({ id: 1, folder_name: 'Outlaws 09-06' });

            const result = await photographerService.recordAlbumIfNew({
                folderName: 'Outlaws 09-06',
                locationId: 9,
                photographerId: 87,
            });

            expect(mockPrisma.photo_albums.create).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        test('handles P2002 unique constraint error (race condition)', async () => {
            mockPrisma.photo_albums.findUnique.mockResolvedValue(null);
            mockPrisma.photo_albums.create.mockRejectedValue({ code: 'P2002' });

            const result = await photographerService.recordAlbumIfNew({
                folderName: 'Outlaws 09-06',
                locationId: 9,
                photographerId: 87,
            });

            expect(result).toBeNull();
        });
    });

    describe('deleteAlbumRecord', () => {
        test('deletes the row for the given folder name', async () => {
            await photographerService.deleteAlbumRecord('Outlaws 09-06');

            expect(mockPrisma.photo_albums.delete).toHaveBeenCalledWith({
                where: { folder_name: 'Outlaws 09-06' },
            });
        });

        test('swallows the error when no row exists for that folder', async () => {
            mockPrisma.photo_albums.delete.mockRejectedValue({ code: 'P2025' });

            await expect(photographerService.deleteAlbumRecord('nope')).resolves.toBeUndefined();
        });
    });

    describe('getPublicProfileByUsername', () => {
        test('returns null when no user has that username', async () => {
            mockPrisma.users.findFirst.mockResolvedValue(null);

            const result = await photographerService.getPublicProfileByUsername('nobody');

            expect(result).toBeNull();
        });

        test('returns null when the user is not a photographer', async () => {
            mockPrisma.users.findFirst.mockResolvedValue({
                id: 1, username: 'bob', roles: { name: 'admin' },
            });

            const result = await photographerService.getPublicProfileByUsername('bob');

            expect(result).toBeNull();
        });

        test('returns the profile shape for a photographer', async () => {
            mockPrisma.users.findFirst.mockResolvedValue({
                id: 87,
                username: 'kirstyn',
                name: 'Kirstyn Henningsen',
                bio: 'Nightlife photographer.',
                photographer_photo_url: 'photographer-photos/87.jpg',
                roles: { name: 'photographer' },
                photographer_links: [{ label: 'Instagram', url: 'https://instagram.com/kirstyn' }],
                photo_albums: [
                    { folder_name: 'Outlaws 09-06', location_id: 9, locations: { name: 'Outlaws' } },
                ],
            });

            const result = await photographerService.getPublicProfileByUsername('kirstyn');

            expect(result).toEqual({
                id: 87,
                username: 'kirstyn',
                name: 'Kirstyn Henningsen',
                bio: 'Nightlife photographer.',
                photoKey: 'photographer-photos/87.jpg',
                links: [{ label: 'Instagram', url: 'https://instagram.com/kirstyn' }],
                albums: [{ folderName: 'Outlaws 09-06', locationId: 9, barName: 'Outlaws' }],
            });
        });
    });

    describe('getMyProfile', () => {
        test('returns user profile with bio, photoKey, and links', async () => {
            mockPrisma.users.findUnique.mockResolvedValue({
                id: 87,
                bio: 'Nightlife photographer.',
                photographer_photo_url: 'photographer-photos/87.jpg',
                photographer_links: [{ label: 'Instagram', url: 'https://instagram.com/kirstyn' }],
            });

            const result = await photographerService.getMyProfile(87);

            expect(result).toEqual({
                bio: 'Nightlife photographer.',
                photoKey: 'photographer-photos/87.jpg',
                links: [{ label: 'Instagram', url: 'https://instagram.com/kirstyn' }],
            });
        });
    });

    describe('updateMyProfile', () => {
        test('updates bio and replaces links in order', async () => {
            await photographerService.updateMyProfile(87, {
                bio: 'New bio',
                links: [{ label: 'Instagram', url: 'https://instagram.com/a' }, { label: 'SmugMug', url: 'https://smugmug.com/b' }],
            });

            expect(mockPrisma.users.update).toHaveBeenCalledWith({
                where: { id: 87 },
                data: { bio: 'New bio' },
            });
            expect(mockPrisma.photographer_links.deleteMany).toHaveBeenCalledWith({ where: { user_id: 87 } });
            expect(mockPrisma.photographer_links.createMany).toHaveBeenCalledWith({
                data: [
                    { user_id: 87, label: 'Instagram', url: 'https://instagram.com/a', sort_order: 0 },
                    { user_id: 87, label: 'SmugMug', url: 'https://smugmug.com/b', sort_order: 1 },
                ],
            });
        });
    });
});
