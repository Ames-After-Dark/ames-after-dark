const mockTx = {
    user_settings: {
        update: jest.fn(),
    },
    user_location_permissions: {
        deleteMany: jest.fn(),
    },
    users: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    user_weekly_checkins: {
        create: jest.fn(),
    },
};

const mockPrisma = {
    user_locations: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
    },
    users: {
        findUnique: jest.fn(),
    },
    user_location_permissions: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
    },
    user_settings: {
        update: jest.fn(),
    },
    $transaction: jest.fn(),
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
}));

const userLocationService = require('../userLocationService');

describe('userLocationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getUserLocationByUserId calls prisma.findUnique with user_id', async () => {
        const sample = { user_id: 1, lat: 1, lng: 2 };
        mockPrisma.user_locations.findUnique.mockResolvedValue(sample);

        const res = await userLocationService.getUserLocationByUserId(1);

        expect(mockPrisma.user_locations.findUnique).toHaveBeenCalledWith({ where: { user_id: 1 } });
        expect(res).toBe(sample);
    });

    test('updateUserLocationByUserId upserts and sets updated_at on update', async () => {
        mockPrisma.user_locations.upsert.mockResolvedValue({ user_id: 1 });

        await userLocationService.updateUserLocationByUserId(1, { lat: 3, lng: 4 });

        const args = mockPrisma.user_locations.upsert.mock.calls[0][0];
        expect(args.where).toEqual({ user_id: 1 });
        expect(args.create).toEqual({ user_id: 1, lat: 3, lng: 4 });
        expect(args.update.lat).toBe(3);
        expect(args.update.updated_at).toBeInstanceOf(Date);
    });

    test('getFriendsLocations returns [] when user not found', async () => {
        mockPrisma.users.findUnique.mockResolvedValue(null);

        const res = await userLocationService.getFriendsLocations(1);

        expect(res).toEqual([]);
    });

    test('getFriendsLocations filters by ghost mode, preference, and explicit permission', async () => {
        const now = new Date();
        const future = new Date(now.getTime() + 60_000);

        mockPrisma.users.findUnique.mockResolvedValue({
            friendships_friendships_user_id_1Tousers: [
                {
                    users_friendships_user_id_2Tousers: {
                        id: 2,
                        username: 'u2',
                        name: 'U2',
                        user_settings: { location_sharing_preference: 'PUBLIC' },
                        user_locations: { lat: 1 },
                        location_permissions_location_permissions_owner_idTousers: [],
                    },
                },
                {
                    users_friendships_user_id_2Tousers: {
                        id: 3,
                        username: 'u3',
                        name: 'U3',
                        user_settings: { location_sharing_preference: 'PRIVATE' },
                        user_locations: { lat: 1 },
                        location_permissions_location_permissions_owner_idTousers: [],
                    },
                },
                {
                    users_friendships_user_id_2Tousers: {
                        id: 4,
                        username: 'u4',
                        name: 'U4',
                        user_settings: { location_sharing_preference: 'SELECTIVE' },
                        user_locations: { lat: 1 },
                        location_permissions_location_permissions_owner_idTousers: [],
                    },
                },
                {
                    users_friendships_user_id_2Tousers: {
                        id: 5,
                        username: 'u5',
                        name: 'U5',
                        user_settings: { location_sharing_preference: 'SELECTIVE' },
                        user_locations: { lat: 1 },
                        location_permissions_location_permissions_owner_idTousers: [{ owner_id: 5, viewer_id: 1 }],
                    },
                },
                {
                    users_friendships_user_id_2Tousers: {
                        id: 6,
                        username: 'u6',
                        name: 'U6',
                        user_settings: { location_sharing_preference: 'PUBLIC', ghost_mode_expires_at: future.toISOString() },
                        user_locations: { lat: 1 },
                        location_permissions_location_permissions_owner_idTousers: [],
                    },
                },
            ],
            friendships_friendships_user_id_2Tousers: [],
        });

        const res = await userLocationService.getFriendsLocations(1);

        // PUBLIC -> included (id:2)
        // PRIVATE -> excluded (id:3)
        // SELECTIVE no permission -> excluded (id:4)
        // SELECTIVE with permission -> included (id:5)
        // ghost mode active -> excluded (id:6)
        expect(res.map(r => r.id).sort()).toEqual([2, 5]);
    });

    test('updatePermission enables via upsert', async () => {
        mockPrisma.user_location_permissions.upsert.mockResolvedValue({});

        await userLocationService.updatePermission(1, 2, true);

        expect(mockPrisma.user_location_permissions.upsert).toHaveBeenCalledWith({
            where: { owner_id_viewer_id: { owner_id: 1, viewer_id: 2 } },
            update: {},
            create: { owner_id: 1, viewer_id: 2 },
        });
    });

    test('updatePermission disables via deleteMany', async () => {
        mockPrisma.user_location_permissions.deleteMany.mockResolvedValue({ count: 1 });

        const res = await userLocationService.updatePermission(1, 2, false);

        expect(mockPrisma.user_location_permissions.deleteMany).toHaveBeenCalledWith({
            where: { owner_id: 1, viewer_id: 2 },
        });
        expect(res).toEqual({ count: 1 });
    });

    test('setGhostMode sets future expiry when hours > 0, null expiry when hours <= 0', async () => {
        mockPrisma.user_settings.update.mockResolvedValue({ user_id: 1 });

        await userLocationService.setGhostMode(1, 2);
        const args1 = mockPrisma.user_settings.update.mock.calls[0][0];
        expect(args1.data.ghost_mode_expires_at).toBeInstanceOf(Date);

        await userLocationService.setGhostMode(1, 0);
        const args2 = mockPrisma.user_settings.update.mock.calls[1][0];
        expect(args2.data.ghost_mode_expires_at).toBeNull();
    });

    test('updateSharingPreference clears permissions when switching to PUBLIC/PRIVATE', async () => {
        mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockTx));
        mockTx.user_settings.update.mockResolvedValue({ user_id: 1, location_sharing_preference: 'PUBLIC' });
        mockTx.user_location_permissions.deleteMany.mockResolvedValue({ count: 2 });

        const res = await userLocationService.updateSharingPreference(1, 'PUBLIC');

        expect(mockTx.user_settings.update).toHaveBeenCalledWith({
            where: { user_id: 1 },
            data: { location_sharing_preference: 'PUBLIC' },
        });
        expect(mockTx.user_location_permissions.deleteMany).toHaveBeenCalledWith({
            where: { owner_id: 1 },
        });
        expect(res.location_sharing_preference).toBe('PUBLIC');
    });

    test('processWeeklyCheckIn returns ALREADY_CHECKED_IN when already checked in', async () => {
        mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockTx));

        // Force deterministic "now" for Luxon
        const { DateTime } = require('luxon');
        jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2026-04-20T12:00:00Z'));

        const localNow = DateTime.now().setZone('UTC');

        mockTx.users.findUnique.mockResolvedValue({
            streak: 5,
            last_streak_week: localNow.weekNumber,
            last_streak_year: localNow.year,
        });

        const res = await userLocationService.processWeeklyCheckIn(1, 10, 'UTC');

        expect(res).toEqual({ status: 'ALREADY_CHECKED_IN', streak: 5 });
    });

    test('processWeeklyCheckIn increments streak for consecutive week and creates ledger', async () => {
        mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockTx));

        const { DateTime } = require('luxon');
        jest.spyOn(DateTime, 'now').mockReturnValue(DateTime.fromISO('2026-04-20T12:00:00Z'));

        const localNow = DateTime.now().setZone('UTC');

        mockTx.users.findUnique.mockResolvedValue({
            streak: 2,
            last_streak_week: localNow.weekNumber - 1,
            last_streak_year: localNow.year,
        });
        mockTx.user_weekly_checkins.create.mockResolvedValue({ id: 1 });
        mockTx.users.update.mockResolvedValue({ streak: 3 });

        const res = await userLocationService.processWeeklyCheckIn(1, 10, 'UTC');

        expect(mockTx.user_weekly_checkins.create).toHaveBeenCalledWith({
            data: {
                user_id: 1,
                location_id: 10,
                week_num: localNow.weekNumber,
                year: localNow.year,
            },
        });
        expect(mockTx.users.update).toHaveBeenCalledWith({
            where: { id: 1 },
            data: expect.objectContaining({
                streak: 3,
                last_streak_week: localNow.weekNumber,
                last_streak_year: localNow.year,
            }),
        });
        expect(res).toEqual({ status: 'SUCCESS', streak: 3 });
    });
});
