const userSettingController = require('../userSettingController');
const userSettingService = require('../../services/userSettingService');
const userService = require('../../services/userService');

jest.mock('../../services/userSettingService');
jest.mock('../../services/userService');

describe('userSettingController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            auth: { payload: { sub: 'auth0|123' } }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('getUserSettings', () => {
        it('should return 401 if auth token is missing', async () => {
            req.auth = {};
            await userSettingController.getUserSettings(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Missing authentication token' });
        });

        it('should return 404 if user not found', async () => {
            userService.getUserByAuth0Id.mockResolvedValue(null);
            await userSettingController.getUserSettings(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        it('should return settings successfully', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            const mockSettings = { push_notifications: true };
            userSettingService.getUserSettingsByUserId.mockResolvedValue(mockSettings);

            await userSettingController.getUserSettings(req, res);
            expect(userService.getUserByAuth0Id).toHaveBeenCalledWith('auth0|123');
            expect(userSettingService.getUserSettingsByUserId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockSettings);
        });

        it('should return 404 if settings not found', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            userSettingService.getUserSettingsByUserId.mockResolvedValue(null);

            await userSettingController.getUserSettings(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Settings not found' });
        });
    });

    describe('updateUserSettings', () => {
        it('should return 401 if auth token is missing', async () => {
            req.auth = {};
            await userSettingController.updateUserSettings(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 404 if user not found', async () => {
            userService.getUserByAuth0Id.mockResolvedValue(null);
            await userSettingController.updateUserSettings(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        it('should update user settings successfully', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            req.body = { push_notifications: false };
            const mockUpdated = { push_notifications: false };
            userSettingService.updateUserSettingsByUserId.mockResolvedValue(mockUpdated);

            await userSettingController.updateUserSettings(req, res);
            expect(userSettingService.updateUserSettingsByUserId).toHaveBeenCalledWith(1, req.body);
            expect(res.json).toHaveBeenCalledWith(mockUpdated);
        });
    });
});
