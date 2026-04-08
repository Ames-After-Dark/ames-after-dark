const friendshipController = require('../friendshipController');
const friendshipService = require('../../services/friendshipService');
const userService = require('../../services/userService');

jest.mock('../../services/friendshipService');
jest.mock('../../services/userService');

describe('Friendship Controller', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            auth: { payload: { sub: 'auth0|123' } },
            query: {}
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('Auth Checks', () => {
        const endpoints = [
            { name: 'getFriends', method: friendshipController.getFriends },
            { name: 'sendFriendRequest', method: friendshipController.sendFriendRequest, extraParams: { friendId: '2' } },
            { name: 'acceptFriendRequest', method: friendshipController.acceptFriendRequest, extraParams: { friendId: '2' } },
            { name: 'declineFriendRequest', method: friendshipController.declineFriendRequest, extraParams: { friendId: '2' } },
            { name: 'blockFriend', method: friendshipController.blockFriend, extraParams: { friendId: '2' } },
            { name: 'removeFriend', method: friendshipController.removeFriend, extraParams: { friendId: '2' } },
            { name: 'getPendingRequests', method: friendshipController.getPendingRequests },
            { name: 'getRecommendedFriends', method: friendshipController.getRecommendedFriends }
        ];

        endpoints.forEach(({ name, method, extraParams = {} }) => {
            describe(`${name}`, () => {
                it('should return 401 if missing auth token', async () => {
                    req.params = { ...extraParams };
                    delete req.auth;

                    await method(req, res);

                    expect(res.status).toHaveBeenCalledWith(401);
                    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
                });

                it('should return 403 if user not found', async () => {
                    req.params = { ...extraParams };
                    userService.getUserByAuth0Id.mockResolvedValue(null);

                    await method(req, res);

                    expect(res.status).toHaveBeenCalledWith(403);
                    expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
                });
            });
        });
    });

    describe('Verify Friend Exists Check', () => {
        const endpoints = [
            { name: 'sendFriendRequest', method: friendshipController.sendFriendRequest, extraParams: { friendId: '2' } },
            { name: 'acceptFriendRequest', method: friendshipController.acceptFriendRequest, extraParams: { friendId: '2' } },
            { name: 'declineFriendRequest', method: friendshipController.declineFriendRequest, extraParams: { friendId: '2' } },
            { name: 'blockFriend', method: friendshipController.blockFriend, extraParams: { friendId: '2' } },
            { name: 'removeFriend', method: friendshipController.removeFriend, extraParams: { friendId: '2' } },
        ];

        endpoints.forEach(({ name, method, extraParams = {} }) => {
            describe(`${name}`, () => {
                it('should return 404 if friend does not exist', async () => {
                    req.params = { ...extraParams };
                    userService.getUserByAuth0Id.mockResolvedValue({ id: 1 });
                    userService.getUserById.mockResolvedValue(null);

                    await method(req, res);

                    expect(res.status).toHaveBeenCalledWith(404);
                    if (name === 'sendFriendRequest' || name === 'removeFriend') {
                        expect(res.json).toHaveBeenCalledWith({ message: 'Person not found' });
                    } else {
                        expect(res.json).toHaveBeenCalledWith({ message: 'Friend not found' });
                    }
                });
            });
        });
    });
});
