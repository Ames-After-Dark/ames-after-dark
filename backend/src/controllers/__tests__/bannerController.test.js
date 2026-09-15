jest.mock('../../lib/r2Storage', () => ({
  s3: { send: jest.fn().mockResolvedValue({}) },
  sanitizeFilename: jest.fn((filename, contentType) => {
    if (!filename || !contentType) return null;
    if (contentType === 'image/jpeg' && filename.endsWith('.jpg')) return filename;
    return null;
  }),
  ALLOWED_UPLOAD_CONTENT_TYPES: { 'image/jpeg': 'jpg' },
}));
jest.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://presigned.example/put'),
}));

process.env.CLOUDFLARE_R2_BANNERS_BUCKET = 'banners';
process.env.CLOUDFLARE_R2_BANNERS_PUBLIC_BASE_URL = 'https://cdn.amesafterdark.com';

const bannerController = require('../bannerController');
const bannerService = require('../../services/bannerService');
const userService = require('../../services/userService');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

jest.mock('../../services/bannerService');
jest.mock('../../services/userService');

function makeRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn(), send: jest.fn() };
}

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

  describe('getBannerUploadUrl', () => {
    const authedReq = (body) => ({ auth: { payload: { sub: 'auth0|123456' } }, body });

    it('returns 401 if unauthenticated', async () => {
      const res = makeRes();
      await bannerController.getBannerUploadUrl({ auth: null, body: {} }, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 for a plain user', async () => {
      userService.getUserRolesByAuth0Id.mockResolvedValue({ isAdmin: false, isDeveloper: false });
      const res = makeRes();
      await bannerController.getBannerUploadUrl(authedReq({ filename: 'a.jpg', contentType: 'image/jpeg' }), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 for an invalid filename/content type', async () => {
      userService.getUserRolesByAuth0Id.mockResolvedValue({ isAdmin: true, isDeveloper: false });
      const res = makeRes();
      await bannerController.getBannerUploadUrl(authedReq({ filename: 'a.exe', contentType: 'application/exe' }), res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns a presigned upload URL and the eventual public URL for a valid admin request', async () => {
      userService.getUserRolesByAuth0Id.mockResolvedValue({ isAdmin: true, isDeveloper: false });
      const res = makeRes();

      await bannerController.getBannerUploadUrl(authedReq({ filename: 'poster.jpg', contentType: 'image/jpeg' }), res);

      expect(getSignedUrl).toHaveBeenCalled();
      const payload = res.json.mock.calls[0][0];
      expect(payload.uploadUrl).toBe('https://presigned.example/put');
      expect(payload.publicUrl).toBe(`https://cdn.amesafterdark.com/${payload.key}`);
      expect(payload.key.endsWith('.jpg')).toBe(true);
    });
  });

  describe('getAllBanners', () => {
    it('returns every banner', async () => {
      const banners = [{ id: 1 }, { id: 2 }];
      bannerService.getAllBanners.mockResolvedValue(banners);
      const res = makeRes();

      await bannerController.getAllBanners({}, res);

      expect(res.json).toHaveBeenCalledWith(banners);
    });
  });

  describe('updateBanner', () => {
    it('returns 403 for a plain user', async () => {
      userService.getUserRolesByAuth0Id.mockResolvedValue({ isAdmin: false, isDeveloper: false });
      const req = { auth: { payload: { sub: 'auth0|1' } }, params: { id: '1' }, body: { name: 'New' } };
      const res = makeRes();

      await bannerController.updateBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(bannerService.updateBanner).not.toHaveBeenCalled();
    });

    it('updates the banner for a developer', async () => {
      userService.getUserRolesByAuth0Id.mockResolvedValue({ isAdmin: false, isDeveloper: true });
      const updated = { id: 1, name: 'New' };
      bannerService.updateBanner.mockResolvedValue(updated);
      const req = { auth: { payload: { sub: 'auth0|1' } }, params: { id: '1' }, body: { name: 'New' } };
      const res = makeRes();

      await bannerController.updateBanner(req, res);

      expect(bannerService.updateBanner).toHaveBeenCalledWith(1, { name: 'New', image_url: undefined });
      expect(res.json).toHaveBeenCalledWith(updated);
    });
  });

  describe('deleteBanner', () => {
    it('returns 404 if the banner does not exist', async () => {
      userService.getUserRolesByAuth0Id.mockResolvedValue({ isAdmin: true, isDeveloper: false });
      bannerService.getBannerById.mockResolvedValue(null);
      const req = { auth: { payload: { sub: 'auth0|1' } }, params: { id: '99' } };
      const res = makeRes();

      await bannerController.deleteBanner(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(bannerService.deleteBanner).not.toHaveBeenCalled();
    });

    it('deletes the banner and responds 204 for an admin', async () => {
      userService.getUserRolesByAuth0Id.mockResolvedValue({ isAdmin: true, isDeveloper: false });
      bannerService.getBannerById.mockResolvedValue({ id: 5, image_url: 'https://cdn.amesafterdark.com/some-key.jpg' });
      bannerService.deleteBanner.mockResolvedValue(undefined);
      const req = { auth: { payload: { sub: 'auth0|1' } }, params: { id: '5' } };
      const res = makeRes();

      await bannerController.deleteBanner(req, res);

      expect(bannerService.deleteBanner).toHaveBeenCalledWith(5);
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
