const mockPrisma = {
    user_favorite_locations: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
    },
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
}));

const userFavoriteService = require('../userFavoriteService');

describe('userFavoriteService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getUserFavoritesByUserId queries favorites ordered by favorited_at desc', async () => {
        const sample = [{ location_id: 1, favorited_at: new Date() }];
        mockPrisma.user_favorite_locations.findMany.mockResolvedValue(sample);

        const res = await userFavoriteService.getUserFavoritesByUserId(2);

        expect(mockPrisma.user_favorite_locations.findMany).toHaveBeenCalledWith({
            where: { user_id: 2 },
            select: { location_id: true, favorited_at: true },
            orderBy: { favorited_at: 'desc' },
        });
        expect(res).toBe(sample);
    });

    test('toggleFavorite deletes existing favorite and returns favorited:false', async () => {
        mockPrisma.user_favorite_locations.findUnique.mockResolvedValue({ user_id: 1, location_id: 5 });

        const res = await userFavoriteService.toggleFavorite(1, 5);

        expect(mockPrisma.user_favorite_locations.delete).toHaveBeenCalledWith({
            where: { user_id_location_id: { user_id: 1, location_id: 5 } },
        });
        expect(res).toEqual({ favorited: false });
    });

    test('toggleFavorite creates missing favorite and returns favorited:true', async () => {
        mockPrisma.user_favorite_locations.findUnique.mockResolvedValue(null);

        const res = await userFavoriteService.toggleFavorite(1, 5);

        expect(mockPrisma.user_favorite_locations.create).toHaveBeenCalledWith({
            data: { user_id: 1, location_id: 5 },
        });
        expect(res).toEqual({ favorited: true });
    });
});
