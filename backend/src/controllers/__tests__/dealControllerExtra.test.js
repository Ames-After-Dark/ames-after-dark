const dealController = require('../dealController');
const dealService = require('../../services/dealService');
const userService = require('../../services/userService');

jest.mock('../../services/dealService');
jest.mock('../../services/userService');

describe('dealController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    res.send = jest.fn().mockReturnThis();
    return res;
  };

  describe('createDeal', () => {
    it('returns 401 if unauthenticated', async () => {
      const req = { auth: null, body: { location_id: 1, name: 'Free Drinks' } };
      const res = mockResponse();

      await dealController.createDeal(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('returns 403 if authenticated but lacking permissions', async () => {
      const req = { auth: { payload: { sub: 'auth0|123' } }, body: { location_id: 1, name: 'Free Drinks' } };
      const res = mockResponse();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: false,
        roles: { name: 'user' },
        location_admins: []
      });

      await dealController.createDeal(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient permissions' });
    });

    it('returns 403 if admin but not for the specific location', async () => {
      const req = { auth: { payload: { sub: 'auth0|123' } }, body: { location_id: 1, name: 'Free Drinks' } };
      const res = mockResponse();

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 2 }] // Mismatched location
      });

      await dealController.createDeal(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient permissions' });
    });

    it('returns 201 if successful as admin for location', async () => {
      const req = { auth: { payload: { sub: 'auth0|123' } }, body: { location_id: 1, name: 'Free Drinks' } };
      const res = mockResponse();
      const mockResult = { id: 1, name: 'Free Drinks' };

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 1 }] // Matched location
      });
      dealService.createDeal.mockResolvedValue(mockResult);

      await dealController.createDeal(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('returns 201 if successful as developer regardless of location admins', async () => {
      const req = { auth: { payload: { sub: 'auth0|123' } }, body: { location_id: 99, name: 'Free Drinks' } };
      const res = mockResponse();
      const mockResult = { id: 1, name: 'Free Drinks' };

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: false,
        roles: { name: 'developer' },
        location_admins: [] // No locations managed explicitly
      });
      dealService.createDeal.mockResolvedValue(mockResult);

      await dealController.createDeal(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('updateDeal', () => {
    it('returns 403 if admin lacks permission for deal location', async () => {
      const req = { auth: { payload: { sub: 'auth0|123' } }, params: { id: '1' }, body: { name: 'Updated' } };
      const res = mockResponse();

      dealService.getDealById.mockResolvedValue({ id: 1, location_id: 5 });
      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 2 }] // Mismatched location
      });

      await dealController.updateDeal(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('deleteDeal', () => {
    it('returns 403 if admin lacks permission for deal location', async () => {
      const req = { auth: { payload: { sub: 'auth0|123' } }, params: { id: '1' } };
      const res = mockResponse();

      dealService.getDealById.mockResolvedValue({ id: 1, location_id: 5 });
      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' },
        location_admins: [{ location_id: 2 }] // Mismatched location
      });

      await dealController.deleteDeal(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});
