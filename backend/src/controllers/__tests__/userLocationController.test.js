const userLocationController = require('../userLocationController');
const userLocationService = require('../../services/userLocationService');
const userService = require('../../services/userService');

jest.mock('../../services/userLocationService');
jest.mock('../../services/userService');

describe('userLocationController', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: {},
            body: {},
            auth: { payload: { sub: 'auth0|123' } }
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    describe('getUserLocation', () => {
        it('should return 401 if auth token is missing', async () => {
            req.auth = {};
            await userLocationController.getUserLocation(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Missing authentication token' });
        });

        it('should return 404 if user not found', async () => {
            userService.getUserByAuth0Id.mockResolvedValue(null);
            await userLocationController.getUserLocation(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        it('should return user location successfully', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            const mockLocation = { id: 101, latitude: 10, longitude: 20 };
            userLocationService.getUserLocationByUserId.mockResolvedValue(mockLocation);

            await userLocationController.getUserLocation(req, res);
            expect(userService.getUserByAuth0Id).toHaveBeenCalledWith('auth0|123');
            expect(userLocationService.getUserLocationByUserId).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockLocation);
        });

        it('should return 404 if location is not found', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            userLocationService.getUserLocationByUserId.mockResolvedValue(null);

            await userLocationController.getUserLocation(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
        });
    });

    describe('updateUserLocation', () => {
        it('should return 401 if auth token is missing', async () => {
            req.auth = {};
            await userLocationController.updateUserLocation(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should update user location successfully', async () => {
            const mockUser = { id: 1 };
            req.body = { latitude: 10, longitude: 20 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            const mockUpdated = { id: 101, latitude: 10, longitude: 20 };
            userLocationService.updateUserLocationByUserId.mockResolvedValue(mockUpdated);

            await userLocationController.updateUserLocation(req, res);
            expect(userLocationService.updateUserLocationByUserId).toHaveBeenCalledWith(1, req.body);
            expect(res.json).toHaveBeenCalledWith(mockUpdated);
        });
    });

    describe('getFriendsLocations', () => {
        it('should return 401 if auth token is missing', async () => {
            req.auth = {};
            await userLocationController.getFriendsLocations(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return friends locations successfully', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            const mockLocations = [{ id: 2, latitude: 30, longitude: 40 }];
            userLocationService.getFriendsLocations.mockResolvedValue(mockLocations);

            await userLocationController.getFriendsLocations(req, res);
            expect(userLocationService.getFriendsLocations).toHaveBeenCalledWith(1);
            expect(res.json).toHaveBeenCalledWith(mockLocations);
        });
    });

    describe('toggleLocationPermission', () => {
        it('should return 401 if auth token is missing', async () => {
            req.auth = {};
            await userLocationController.toggleLocationPermission(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Missing authentication token' });
        });

        it('should return 404 if user not found', async () => {
            userService.getUserByAuth0Id.mockResolvedValue(null);
            await userLocationController.toggleLocationPermission(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
        });

        it('should return 400 if enabled is not a boolean', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            req.params.viewerId = '2';
            req.body = { enabled: 'true' }; // invalid type
            await userLocationController.toggleLocationPermission(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "enabled (bool) is required." });
        });

        it('should update location permission successfully', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            req.params.viewerId = '2';
            req.body = { enabled: true };
            userLocationService.updatePermission.mockResolvedValue(true);

            await userLocationController.toggleLocationPermission(req, res);
            expect(userLocationService.updatePermission).toHaveBeenCalledWith(1, 2, true);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: "Permission granted" });
        });

        it('should return revoked message when enabled is false', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            req.params.viewerId = '2';
            req.body = { enabled: false };
            userLocationService.updatePermission.mockResolvedValue(true);

            await userLocationController.toggleLocationPermission(req, res);
            expect(userLocationService.updatePermission).toHaveBeenCalledWith(1, 2, false);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ success: true, message: "Permission revoked" });
        });
    });

    describe('setGhostMode', () => {
        it('should return 401 if auth token is missing', async () => {
            req.auth = {};
            await userLocationController.setGhostMode(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 if hours is not a number', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            req.body = { hours: '24' };
            await userLocationController.setGhostMode(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Hours must be a number' });
        });

        it('should set ghost mode successfully', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            req.body = { hours: 24 };
            const mockResult = { ghost_mode_expires_at: '2026-04-09T00:00:00Z' };
            userLocationService.setGhostMode.mockResolvedValue(mockResult);

            await userLocationController.setGhostMode(req, res);
            expect(userLocationService.setGhostMode).toHaveBeenCalledWith(1, 24);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                ghost_mode_expires_at: mockResult.ghost_mode_expires_at,
                message: 'Ghost mode enabled for 24 hours'
            });
        });

        it('should handle zero hours (disabling ghost mode)', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            req.body = { hours: 0 };
            const mockResult = { ghost_mode_expires_at: null };
            userLocationService.setGhostMode.mockResolvedValue(mockResult);

            await userLocationController.setGhostMode(req, res);
            expect(userLocationService.setGhostMode).toHaveBeenCalledWith(1, 0);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                ghost_mode_expires_at: mockResult.ghost_mode_expires_at,
                message: 'Ghost mode disabled'
            });
        });
    });

    describe('updateSharingPreference', () => {
        it('should return 401 if auth token is missing', async () => {
            req.auth = {};
            await userLocationController.updateSharingPreference(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should return 400 for invalid preference', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            req.body = { preference: 'INVALID' };

            await userLocationController.updateSharingPreference(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid preference value' });
        });

        it('should update sharing preference successfully', async () => {
            const mockUser = { id: 1 };
            userService.getUserByAuth0Id.mockResolvedValue(mockUser);
            req.body = { preference: 'PRIVATE' };
            const mockResult = { location_sharing_preference: 'PRIVATE' };
            userLocationService.updateSharingPreference.mockResolvedValue(mockResult);

            await userLocationController.updateSharingPreference(req, res);
            expect(userLocationService.updateSharingPreference).toHaveBeenCalledWith(1, 'PRIVATE');
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                preference: mockResult.location_sharing_preference
            });
        });
    });
});
