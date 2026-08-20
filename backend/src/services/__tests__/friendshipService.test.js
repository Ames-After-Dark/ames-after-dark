const mockTx = {
    friendships: {
        delete: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    user_location_permissions: {
        deleteMany: jest.fn(),
    },
    users: {
        findMany: jest.fn(),
    },
};

const mockPrisma = {
    friendships: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    },
    users: {
        findMany: jest.fn(),
    },
    $transaction: jest.fn(),
};

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => mockPrisma),
}));

const friendshipService = require('../friendshipService');

describe('friendshipService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('isBlocked returns true when blocked friendship exists', async () => {
        mockPrisma.friendships.findFirst.mockResolvedValue({ id: 1 });

        const res = await friendshipService.isBlocked(1, 2);

        expect(mockPrisma.friendships.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    friendship_status_id: 4,
                    OR: expect.any(Array),
                }),
            })
        );
        expect(res).toBe(true);
    });

    test('getFriends maps accepted friendships to the other user object', async () => {
        mockPrisma.friendships.findMany.mockResolvedValue([
            {
                user_id_1: 1,
                user_id_2: 2,
                users_friendships_user_id_1Tousers: { id: 1, username: 'me' },
                users_friendships_user_id_2Tousers: { id: 2, username: 'them' },
            },
        ]);

        const res = await friendshipService.getFriends(1);

        expect(res).toEqual([{ id: 2, username: 'them' }]);
    });

    test('getFriendsOfFriend throws when requester and friend are not accepted friends', async () => {
        mockPrisma.friendships.findFirst.mockResolvedValue(null);

        await expect(friendshipService.getFriendsOfFriend(1, 2)).rejects.toThrow('Not friends');
    });

    test('getFriendsOfFriend filters out candidates blocked by user', async () => {
        // first findFirst: confirm user and friend are friends
        mockPrisma.friendships.findFirst.mockResolvedValue({ id: 10 });

        // friend friendships
        mockPrisma.friendships.findMany
            // friendFriendships
            .mockResolvedValueOnce([
                {
                    user_id_1: 2,
                    user_id_2: 3,
                    users_friendships_user_id_1Tousers: { id: 2 },
                    users_friendships_user_id_2Tousers: { id: 3, username: 'c3' },
                },
            ])
            // blockedRelations
            .mockResolvedValueOnce([
                { user_id_1: 1, user_id_2: 3 },
            ]);

        const res = await friendshipService.getFriendsOfFriend(1, 2);

        expect(res).toEqual([]);
    });

    test('sendFriendRequest rejects when friendship already exists', async () => {
        mockPrisma.friendships.findUnique.mockResolvedValue({ user_id_1: 1, user_id_2: 2 });

        await expect(friendshipService.sendFriendRequest(1, 2)).rejects.toThrow(/already exists/i);
    });

    test('sendFriendRequest creates pending request', async () => {
        mockPrisma.friendships.findUnique.mockResolvedValue(null);
        mockPrisma.friendships.create.mockResolvedValue({ id: 1 });

        const res = await friendshipService.sendFriendRequest(5, 9);

        expect(mockPrisma.friendships.create).toHaveBeenCalledWith({
            data: { user_id_1: 5, user_id_2: 9, friendship_status_id: 1 },
        });
        expect(res).toEqual({ id: 1 });
    });

    test('acceptFriendRequest throws when pending friendship not found', async () => {
        mockPrisma.friendships.findFirst.mockResolvedValue(null);

        await expect(friendshipService.acceptFriendRequest(1, 2)).rejects.toThrow(/not found/i);
    });

    test('acceptFriendRequest updates status to accepted using composite key from found record', async () => {
        mockPrisma.friendships.findFirst.mockResolvedValue({ user_id_1: 2, user_id_2: 1 });
        mockPrisma.friendships.update.mockResolvedValue({ user_id_1: 2, user_id_2: 1, friendship_status_id: 2 });

        const res = await friendshipService.acceptFriendRequest(1, 2);

        expect(mockPrisma.friendships.update).toHaveBeenCalledWith({
            where: { user_id_1_user_id_2: { user_id_1: 2, user_id_2: 1 } },
            data: { friendship_status_id: 2 },
        });
        expect(res.friendship_status_id).toBe(2);
    });

    test('removeFriend deletes friendship and clears permissions in a transaction', async () => {
        mockPrisma.friendships.findFirst.mockResolvedValue({ user_id_1: 1, user_id_2: 2 });
        mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockTx));
        mockTx.friendships.delete.mockResolvedValue({ deleted: true });

        const res = await friendshipService.removeFriend(1, 2);

        expect(mockTx.friendships.delete).toHaveBeenCalled();
        expect(mockTx.user_location_permissions.deleteMany).toHaveBeenCalled();
        expect(res).toEqual({ deleted: true });
    });

    test('blockFriend creates a blocked record when none exists, and clears permissions', async () => {
        mockPrisma.friendships.findFirst.mockResolvedValue(null);
        mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockTx));
        mockTx.friendships.create.mockResolvedValue({ friendship_status_id: 4 });

        const res = await friendshipService.blockFriend(1, 2);

        expect(mockTx.user_location_permissions.deleteMany).toHaveBeenCalled();
        expect(mockTx.friendships.create).toHaveBeenCalledWith({
            data: { user_id_1: 1, user_id_2: 2, friendship_status_id: 4 },
        });
        expect(res.friendship_status_id).toBe(4);
    });

    test('getPendingRequests returns pending where user is either side', async () => {
        const pending = [{ id: 1 }];
        mockPrisma.friendships.findMany.mockResolvedValue(pending);

        const res = await friendshipService.getPendingRequests(3);

        expect(mockPrisma.friendships.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ friendship_status_id: 1, OR: expect.any(Array) }),
                include: expect.any(Object),
            })
        );
        expect(res).toBe(pending);
    });

    test('getRecommendedFriends uses simple recommendations when no accepted friends', async () => {
        // userFriendships: one pending
        mockPrisma.friendships.findMany.mockResolvedValue([
            { user_id_1: 1, user_id_2: 2, friendship_status_id: 1 },
        ]);
        // getSimpleRecommendations -> prisma.users.findMany
        mockPrisma.users.findMany.mockResolvedValue([{ id: 9, username: 'u9' }]);

        const res = await friendshipService.getRecommendedFriends(1, 10);

        expect(mockPrisma.users.findMany).toHaveBeenCalledWith(
            expect.objectContaining({ where: expect.any(Object), take: 10 })
        );
        expect(res).toEqual([{ user: { id: 9, username: 'u9' }, mutualCount: 0 }]);
    });
});
