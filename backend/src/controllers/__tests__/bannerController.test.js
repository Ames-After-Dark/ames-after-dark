const bannerController = require('../bannerController');
const bannerService = require('../../services/bannerService');
const userService = require('../../services/userService');

jest.mock('../../services/bannerService');
jest.mock('../../services/userService');

describe('bannerController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBanner', () => {
    it('should return 401 if user is not authenticated', async () => {
      const req = {
        auth: null,
        body: {
          name: 'Test Banner',
          image_url: 'http://example.com/image.jpg'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await bannerController.createBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });

    it('should return 403 if user has insufficient permissions', async () => {
      const req = {
        auth: {
          payload: {
            sub: 'auth0|123456'
          }
        },
        body: {
          name: 'Test Banner',
          image_url: 'http://example.com/image.jpg'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: false,
        roles: { name: 'user' }
      });

      await bannerController.createBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient permissions' });
      expect(userService.getUserRolesByAuth0Id).toHaveBeenCalledWith('auth0|123456');
    });

    it('should allow user with developer role to create a banner', async () => {
      const req = {
        auth: {
          payload: {
            sub: 'auth0|123456'
          }
        },
        body: {
          name: 'Test Banner',
          image_url: 'http://example.com/image.jpg'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: false,
        roles: { name: 'developer' }
      });
      
      const newBanner = { id: 1, name: 'Test Banner', image_url: 'http://example.com/image.jpg' };
      bannerService.createBanner.mockResolvedValue(newBanner);

      await bannerController.createBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newBanner);
      expect(bannerService.createBanner).toHaveBeenCalledWith({
        name: 'Test Banner',
        image_url: 'http://example.com/image.jpg'
      });
    });
    
    it('should allow user with admin role to create a banner', async () => {
      const req = {
        auth: {
          payload: {
            sub: 'auth0|123456'
          }
        },
        body: {
          name: 'Test Banner',
          image_url: 'http://example.com/image.jpg'
        }
      };
      
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      userService.getUserRolesByAuth0Id.mockResolvedValue({
        isAdmin: true,
        roles: { name: 'admin' }
      });
      
      const newBanner = { id: 1, name: 'Test Banner', image_url: 'http://example.com/image.jpg' };
      bannerService.createBanner.mockResolvedValue(newBanner);

      await bannerController.createBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newBanner);
    });
  });
});
