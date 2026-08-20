jest.mock('../../services/locationService', () => ({
  getLocations: jest.fn(),
  getLocationById: jest.fn(),
  createLocation: jest.fn(),
  updateLocation: jest.fn(),
  deleteLocation: jest.fn(),
}));

jest.mock('../../services/userService', () => ({
  getUserRolesByAuth0Id: jest.fn(),
  getUserByAuth0Id: jest.fn(),
  isAdminForLocation: jest.fn(),
}));

const locationService = require('../../services/locationService');
const userService = require('../../services/userService');
const locationController = require('../locationController');

const createRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe('locationController', () => {
  beforeEach(() => jest.clearAllMocks());

  test('getLocations returns JSON list', async () => {
    const sample = [{ id: 1 }];
    locationService.getLocations.mockResolvedValue(sample);

    const res = createRes();
    await locationController.getLocations({}, res);

    expect(locationService.getLocations).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(sample);
  });

  test('getLocationById handles invalid id with 400', async () => {
    const req = { params: { id: 'x' } };
    const res = createRes();

    await locationController.getLocationById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ID' });
  });

  test('getLocationById returns 404 when not found', async () => {
    locationService.getLocationById.mockResolvedValue(null);
    const req = { params: { id: '9' } };
    const res = createRes();

    await locationController.getLocationById(req, res);

    expect(locationService.getLocationById).toHaveBeenCalledWith(9);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Location not found' });
  });

  describe('authorization', () => {
    test('createLocation -> 401 when no auth', async () => {
      const req = { body: { name: 'X' } };
      const res = createRes();

      await locationController.createLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    test('createLocation -> 403 when not dev or admin', async () => {
      const req = { auth: { payload: { sub: 'auth|1' } }, body: { name: 'X' } };
      const res = createRes();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: false,
        roles: { name: 'user' }
      });

      await locationController.createLocation(req, res);

      expect(userService.getUserRolesByAuth0Id).toHaveBeenCalledWith('auth|1');
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Insufficient permissions' });
    });

    test('createLocation -> 201 when developer', async () => {
      const req = { auth: { payload: { sub: 'auth|dev' } }, body: { name: 'New' } };
      const res = createRes();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'developer' }
      });
      locationService.createLocation.mockResolvedValue({ id: 10, name: 'New' });

      await locationController.createLocation(req, res);

      expect(locationService.createLocation).toHaveBeenCalledWith({ name: 'New' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 10, name: 'New' });
    });

    test('updateLocation -> 403 when not dev nor admin for location', async () => {
      const req = { params: { id: '5' }, auth: { payload: { sub: 'auth|u1' } }, body: { name: 'Updated' } };
      const res = createRes();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 99 }]
      });

      await locationController.updateLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Insufficient permissions' });
    });

    test('updateLocation -> 200 when admin for location', async () => {
      const req = { params: { id: '5' }, auth: { payload: { sub: 'auth|u2' } }, body: { name: 'Updated' } };
      const res = createRes();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 5 }]
      });
      locationService.updateLocation.mockResolvedValue({ id: 5, name: 'Updated' });

      await locationController.updateLocation(req, res);

      expect(locationService.updateLocation).toHaveBeenCalledWith(5, { name: 'Updated' });
      expect(res.json).toHaveBeenCalledWith({ id: 5, name: 'Updated' });
    });

    test('deleteLocation -> 403 when not allowed', async () => {
      const req = { params: { id: '7' }, auth: { payload: { sub: 'auth|u3' } } };
      const res = createRes();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 42 }]
      });

      await locationController.deleteLocation(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Insufficient permissions' });
    });

    test('deleteLocation -> success when developer', async () => {
      const req = { params: { id: '8' }, auth: { payload: { sub: 'auth|dev2' } } };
      const res = createRes();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'developer' },
        location_admins: []
      });
      locationService.deleteLocation.mockResolvedValue({ id: 8, name: 'ToDelete' });

      await locationController.deleteLocation(req, res);

      expect(locationService.deleteLocation).toHaveBeenCalledWith(8);
      expect(res.json).toHaveBeenCalledWith({ id: 8, name: 'ToDelete' });
    });
  });
});
