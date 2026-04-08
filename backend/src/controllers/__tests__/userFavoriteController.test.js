const userFavoriteController = require('../userFavoriteController');
const userFavoriteService = require('../../services/userFavoriteService');
const userService = require('../../services/userService');

jest.mock('../../services/userFavoriteService');
jest.mock('../../services/userService');

describe('userFavoriteController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: {},
            body: {},
            auth: { payload: { sub: 'auth0|123' } }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        jest.clearAllMocks();
    });

    describe('getUserFavoritesByUserId', () => {
        it('should return 400 if user ID is invalid', async () => {
            req.params.userId = 'invalid';
            await userFavoriteController.getUserFavoritesByUserId(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid User ID' });
        });

        it('should return user favorites successfully', async () => {
            req.params.userId = '1';
            const mockResult = [{ location_id: 2, favorited_at: new Date() }];
            userFavoriteService.getUserFavoritesByUserId.mockResolvedValue(mockResult);

            await userFavoriteController.getUserFavoritesByUserId(req, res);
            expect(userFavoriteService.getUserFavoritesByUserId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it('should return 500 if an error occurs', async () => {
            req.params.userId = '1';
            userFavoriteService.getUserFavoritesByUserId.mockRejectedValue(new Error('DB error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            await userFavoriteController.getUserFavoritesByUserId(req, res);
            expect(consoleSpy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
            consoleSpy.mockRestore();
        });
    });

    describe('toggleFavorite', () => {
        it('should return 400 if location ID is invalid', async () => {
            req.body = { locationId: 'invalid' };
            await userFavoriteController.toggleFavorite(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Location ID' });
        });

        it('should return 401 if authentication token is missing', async () => {
            req.body = { locationId: 2 };
            req.auth = {};
            await userFavoriteController.toggleFavorite(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Missing authentication token' });
        });

        it('should return 404 if user is not found', async () => {
            req.body = { locationId: 2 };
            userService.getUserByAuth0Id.mockResolvedValue(null);

            await userFavoriteController.toggleFavorite(req, res);
            expect(userService.getUserByAuth0Id).toHaveBeenCalledWith('auth0|123');
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        it('should toggle favorite successfully', async () => {
            req.body = { locationId: 2 };
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            const mockResult = { favorited: true };
            userFavoriteService.toggleFavorite.mockResolvedValue(mockResult);

            await userFavoriteController.toggleFavorite(req, res);
            expect(userService.getUserByAuth0Id).toHaveBeenCalledWith('auth0|123');
            expect(userFavoriteService.toggleFavorite).toHaveBeenCalledWith(1, 2);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it('should return 500 if an error occurs', async () => {
            req.body = { locationId: 2 };
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            userFavoriteService.toggleFavorite.mockRejectedValue(new Error('DB error'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            await userFavoriteController.toggleFavorite(req, res);
            expect(consoleSpy).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
            consoleSpy.mockRestore();
        });
    });
});
