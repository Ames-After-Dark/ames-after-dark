jest.mock('../../services/photographerService');
jest.mock('../../services/userService');
jest.mock('../../lib/r2Storage', () => ({
  signedUrlForKey: jest.fn(),
  listR2Objects: jest.fn(),
  parseFolderName: jest.fn((folderName) => {
    const match = String(folderName || '').match(/^(.+?)[\s_]+(\d{1,2}[-\/]\d{1,2})$/);
    return match ? { displayName: match[1], dateStr: match[2] } : { displayName: folderName, dateStr: null };
  }),
  parseDateStr: jest.fn((dateStr) => (dateStr ? new Date(2026, 0, 1) : null)),
  formatDateStr: jest.fn((dateStr) => dateStr || null),
  ALLOWED_UPLOAD_CONTENT_TYPES: {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  },
  sanitizeFilename: jest.fn((filename, contentType) => {
    const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
    if (!filename || !map[contentType]) return null;
    return filename;
  }),
  s3: {},
  CLOUDFLARE_R2_BUCKET: 'test-bucket',
}));
jest.mock('@aws-sdk/client-s3', () => ({
  PutObjectCommand: jest.fn().mockImplementation((args) => ({ ...args, __command: 'PutObjectCommand' })),
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

const photographerController = require('../photographerController');
const photographerService = require('../../services/photographerService');
const userService = require('../../services/userService');
const { signedUrlForKey, listR2Objects } = require('../../lib/r2Storage');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

function mockRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe('photographerController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPublicProfile', () => {
    test('returns 404 for a nonexistent/non-photographer username', async () => {
      photographerService.getPublicProfileByUsername.mockResolvedValue(null);
      const req = { params: { username: 'nobody' } };
      const res = mockRes();

      await photographerController.getPublicProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Photographer not found' });
    });

    test('returns 200 with the expected shape for a photographer, filtering out coverless albums', async () => {
      photographerService.getPublicProfileByUsername.mockResolvedValue({
        id: 87,
        name: 'Kirstyn Henningsen',
        bio: 'Nightlife photographer.',
        photoKey: 'photographer-photos/87.jpg',
        links: [{ label: 'Instagram', url: 'https://instagram.com/kirstyn' }],
        albums: [
          { folderName: 'Outlaws 09-06', locationId: 9, barName: 'Outlaws' },
          { folderName: 'Sips 09-13', locationId: 4, barName: 'Sips' },
        ],
      });
      signedUrlForKey.mockResolvedValue('https://signed.example.com/photo.jpg');
      // First album has photos (a cover), second is a phantom/emptied album.
      listR2Objects.mockImplementation(async (prefix) => {
        if (prefix.startsWith('Outlaws')) {
          return [{ Key: 'Outlaws 09-06/a.jpg', LastModified: new Date() }];
        }
        return [];
      });

      const req = { params: { username: 'kirstyn' } };
      const res = mockRes();

      await photographerController.getPublicProfile(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledTimes(1);
      const payload = res.json.mock.calls[0][0];
      expect(payload.name).toBe('Kirstyn Henningsen');
      expect(payload.bio).toBe('Nightlife photographer.');
      expect(payload.photoUrl).toBe('https://signed.example.com/photo.jpg');
      expect(payload.links).toEqual([{ label: 'Instagram', url: 'https://instagram.com/kirstyn' }]);
      expect(payload.albums).toHaveLength(1);
      expect(payload.albums[0]).toMatchObject({ folder: 'Outlaws 09-06', barName: 'Outlaws' });
      expect(payload.albums[0].coverUrl).toBe('https://signed.example.com/photo.jpg');
      // sortDate is an internal sorting field only - must not leak to clients.
      expect(payload.albums[0]).not.toHaveProperty('sortDate');
    });
  });

  describe('requirePhotographer (via updateMyProfile)', () => {
    test('returns 401 with no auth', async () => {
      const req = { auth: null, body: {} };
      const res = mockRes();

      await photographerController.updateMyProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(userService.getUserRolesByAuth0Id).not.toHaveBeenCalled();
    });

    test('returns 403 for a non-photographer role', async () => {
      userService.getUserRolesByAuth0Id.mockResolvedValue({ id: 1, roles: { name: 'user' } });
      const req = { auth: { payload: { sub: 'auth0|123' } }, body: {} };
      const res = mockRes();

      await photographerController.updateMyProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: requires photographer role' });
      expect(photographerService.updateMyProfile).not.toHaveBeenCalled();
    });
  });

  describe('getPhotoUploadUrl', () => {
    test('returns 400 for an invalid content type', async () => {
      userService.getUserRolesByAuth0Id.mockResolvedValue({ id: 87, roles: { name: 'photographer' } });
      const req = {
        auth: { payload: { sub: 'auth0|123' } },
        body: { filename: 'photo.bmp', contentType: 'image/bmp' },
      };
      const res = mockRes();

      await photographerController.getPhotoUploadUrl(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Invalid filename or content type') })
      );
    });

    test('generates the expected deterministic key format for a valid content type', async () => {
      userService.getUserRolesByAuth0Id.mockResolvedValue({ id: 87, roles: { name: 'photographer' } });
      getSignedUrl.mockResolvedValue('https://upload.example.com/put-url');
      const req = {
        auth: { payload: { sub: 'auth0|123' } },
        body: { filename: 'photo.jpg', contentType: 'image/jpeg' },
      };
      const res = mockRes();

      await photographerController.getPhotoUploadUrl(req, res);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        uploadUrl: 'https://upload.example.com/put-url',
        key: 'photographer-photos/87.jpg',
      });
    });
  });

  describe('updateMyProfile - photoKey validation (Finding 1)', () => {
    beforeEach(() => {
      userService.getUserRolesByAuth0Id.mockResolvedValue({ id: 87, roles: { name: 'photographer' } });
    });

    test('accepts a photoKey matching the caller\'s own deterministic pattern', async () => {
      const req = {
        auth: { payload: { sub: 'auth0|123' } },
        body: { photoKey: 'photographer-photos/87.jpg' },
      };
      const res = mockRes();

      await photographerController.updateMyProfile(req, res);

      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(photographerService.updateMyProfile).toHaveBeenCalledWith(
        87,
        expect.objectContaining({ photoKey: 'photographer-photos/87.jpg' })
      );
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test('rejects a photoKey for a different user id', async () => {
      const req = {
        auth: { payload: { sub: 'auth0|123' } },
        body: { photoKey: 'photographer-photos/999.jpg' },
      };
      const res = mockRes();

      await photographerController.updateMyProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid photoKey' });
      expect(photographerService.updateMyProfile).not.toHaveBeenCalled();
    });

    test('rejects a photoKey pointing at an arbitrary/hidden R2 object', async () => {
      const req = {
        auth: { payload: { sub: 'auth0|123' } },
        body: { photoKey: 'some-other-folder/hidden_secret.jpg' },
      };
      const res = mockRes();

      await photographerController.updateMyProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(photographerService.updateMyProfile).not.toHaveBeenCalled();
    });
  });

  describe('updateMyProfile - links validation (Finding 3)', () => {
    beforeEach(() => {
      userService.getUserRolesByAuth0Id.mockResolvedValue({ id: 87, roles: { name: 'photographer' } });
    });

    test('accepts valid links and trims whitespace before passing to the service', async () => {
      const req = {
        auth: { payload: { sub: 'auth0|123' } },
        body: { links: [{ label: '  Instagram  ', url: '  https://instagram.com/a  ' }] },
      };
      const res = mockRes();

      await photographerController.updateMyProfile(req, res);

      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(photographerService.updateMyProfile).toHaveBeenCalledWith(
        87,
        expect.objectContaining({ links: [{ label: 'Instagram', url: 'https://instagram.com/a' }] })
      );
    });

    test('rejects a javascript: URL scheme', async () => {
      const req = {
        auth: { payload: { sub: 'auth0|123' } },
        body: { links: [{ label: 'Evil', url: 'javascript:alert(1)' }] },
      };
      const res = mockRes();

      await photographerController.updateMyProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(photographerService.updateMyProfile).not.toHaveBeenCalled();
    });

    test('rejects a link with an empty label', async () => {
      const req = {
        auth: { payload: { sub: 'auth0|123' } },
        body: { links: [{ label: '   ', url: 'https://example.com' }] },
      };
      const res = mockRes();

      await photographerController.updateMyProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(photographerService.updateMyProfile).not.toHaveBeenCalled();
    });

    test('rejects a label longer than 100 characters', async () => {
      const req = {
        auth: { payload: { sub: 'auth0|123' } },
        body: { links: [{ label: 'x'.repeat(101), url: 'https://example.com' }] },
      };
      const res = mockRes();

      await photographerController.updateMyProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(photographerService.updateMyProfile).not.toHaveBeenCalled();
    });

    test('rejects a url longer than 512 characters', async () => {
      const req = {
        auth: { payload: { sub: 'auth0|123' } },
        body: { links: [{ label: 'Long', url: `https://example.com/${'a'.repeat(510)}` }] },
      };
      const res = mockRes();

      await photographerController.updateMyProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(photographerService.updateMyProfile).not.toHaveBeenCalled();
    });

    test('rejects more than 20 links', async () => {
      const links = Array.from({ length: 21 }, (_, i) => ({ label: `Link ${i}`, url: 'https://example.com' }));
      const req = {
        auth: { payload: { sub: 'auth0|123' } },
        body: { links },
      };
      const res = mockRes();

      await photographerController.updateMyProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(photographerService.updateMyProfile).not.toHaveBeenCalled();
    });

    test('rejects a non-array links value', async () => {
      const req = {
        auth: { payload: { sub: 'auth0|123' } },
        body: { links: 'not-an-array' },
      };
      const res = mockRes();

      await photographerController.updateMyProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(photographerService.updateMyProfile).not.toHaveBeenCalled();
    });
  });
});
