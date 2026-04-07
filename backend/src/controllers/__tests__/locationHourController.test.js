const locationHourController = require('../locationHourController');
const locationHoursService = require('../../services/locationHoursService');
const userService = require('../../services/userService');
const { PrismaClient } = require('@prisma/client');

jest.mock('../../services/locationHoursService');
jest.mock('../../services/userService');
jest.mock('@prisma/client', () => {
    const mPrisma = {
        location_hours_overrides: {
            findUnique: jest.fn(),
        },
    };
    return { PrismaClient: jest.fn(() => mPrisma) };
});

const prisma = new PrismaClient();

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('locationHourController authorization', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('updateWeeklyHours', () => {
        test('401 when no auth', async () => {
            const req = { params: { locationId: '1' }, body: { hours: [] } };
            const res = mockResponse();

            await locationHourController.updateWeeklyHours(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
        });

        test('403 when not admin for location', async () => {
            const req = {
                params: { locationId: '1' },
                body: { hours: [] },
                auth: { payload: { sub: 'auth|2' } }
            };
            const res = mockResponse();

            userService.getUserRolesByAuth0Id.mockResolvedValue({
                isAdmin: true,
                roles: { name: 'admin' },
                location_admins: [{ location_id: 99 }]
            });

            await locationHourController.updateWeeklyHours(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('200 when dev', async () => {
            const req = {
                params: { locationId: '1' },
                body: { hours: [] },
                auth: { payload: { sub: 'auth|dev' } }
            };
            const res = mockResponse();

            userService.getUserRolesByAuth0Id.mockResolvedValue({
                isAdmin: true,
                roles: { name: 'developer' }
            });
            locationHoursService.updateWeeklyHours.mockResolvedValue(true);

            await locationHourController.updateWeeklyHours(req, res);

            expect(res.json).toHaveBeenCalledWith({ message: 'Weekly schedule updated successfully' });
        });

        test('200 when admin for location', async () => {
            const req = {
                params: { locationId: '1' },
                body: { hours: [] },
                auth: { payload: { sub: 'auth|admin' } }
            };
            const res = mockResponse();

            userService.getUserRolesByAuth0Id.mockResolvedValue({
                isAdmin: true,
                roles: { name: 'admin' },
                location_admins: [{ location_id: 1 }]
            });
            locationHoursService.updateWeeklyHours.mockResolvedValue(true);

            await locationHourController.updateWeeklyHours(req, res);

            expect(res.json).toHaveBeenCalledWith({ message: 'Weekly schedule updated successfully' });
        });
    });

    describe('createOverride', () => {
        test('403 when not dev or valid admin', async () => {
            const req = {
                params: { locationId: '1' },
                body: {},
                auth: { payload: { sub: 'auth|3' } }
            };
            const res = mockResponse();

            userService.getUserRolesByAuth0Id.mockResolvedValue({
                isAdmin: false,
                roles: { name: 'user' }
            });

            await locationHourController.createOverride(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('201 when admin is for location', async () => {
            const req = {
                params: { locationId: '3' },
                body: { mockOverride: true },
                auth: { payload: { sub: 'auth|admin3' } }
            };
            const res = mockResponse();

            userService.getUserRolesByAuth0Id.mockResolvedValue({
                isAdmin: true,
                roles: { name: 'admin' },
                location_admins: [{ location_id: 3 }]
            });
            locationHoursService.createOverride.mockResolvedValue({ id: 5 });

            await locationHourController.createOverride(req, res);

            expect(locationHoursService.createOverride).toHaveBeenCalledWith(3, req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ id: 5 });
        });
    });

    describe('deleteOverride', () => {
        test('404 when override does not exist', async () => {
            const req = {
                params: { overrideId: '99' },
                auth: { payload: { sub: 'auth|4' } }
            };
            const res = mockResponse();

            prisma.location_hours_overrides.findUnique.mockResolvedValue(null);

            await locationHourController.deleteOverride(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Override not found' });
        });

        test('403 when user is not admin for the override location', async () => {
            const req = {
                params: { overrideId: '5' },
                auth: { payload: { sub: 'auth|badadmin' } }
            };
            const res = mockResponse();

            prisma.location_hours_overrides.findUnique.mockResolvedValue({ location_id: 10 });
            userService.getUserRolesByAuth0Id.mockResolvedValue({
                isAdmin: true,
                roles: { name: 'admin' },
                location_admins: [{ location_id: 99 }]
            });

            await locationHourController.deleteOverride(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
        });

        test('200 when user is admin for override location', async () => {
            const req = {
                params: { overrideId: '5' },
                auth: { payload: { sub: 'auth|goodadmin' } }
            };
            const res = mockResponse();

            prisma.location_hours_overrides.findUnique.mockResolvedValue({ location_id: 10 });
            userService.getUserRolesByAuth0Id.mockResolvedValue({
                isAdmin: true,
                roles: { name: 'admin' },
                location_admins: [{ location_id: 10 }]
            });
            locationHoursService.deleteOverride.mockResolvedValue(true);

            await locationHourController.deleteOverride(req, res);

            expect(locationHoursService.deleteOverride).toHaveBeenCalledWith(5);
            expect(res.json).toHaveBeenCalledWith({ message: 'Override removed successfully' });
        });
    });
});
