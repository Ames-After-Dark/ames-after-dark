jest.mock('../../services/galleryService');
jest.mock('../../services/userService');

const galleryService = require('../../services/galleryService');
const userService = require('../../services/userService');
const galleryController = require('../galleryController');

function mockRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.redirect = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    return res;
}

describe('galleryController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getPreview', () => {
        test('returns 400 for an invalid key', async () => {
            galleryService.isValidPhotoKey.mockReturnValue(false);
            const req = { query: { key: '../etc/passwd' } };
            const res = mockRes();

            await galleryController.getPreview(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(galleryService.getOrCreatePreviewUrl).not.toHaveBeenCalled();
        });

        test('redirects to the preview url for a valid key', async () => {
            galleryService.isValidPhotoKey.mockReturnValue(true);
            galleryService.getOrCreatePreviewUrl.mockResolvedValue('https://example.com/thumb.jpg');
            const req = { query: { key: 'Outlaws 09-06/_DSC1.jpg' } };
            const res = mockRes();

            await galleryController.getPreview(req, res);

            expect(galleryService.getOrCreatePreviewUrl).toHaveBeenCalledWith('Outlaws 09-06/_DSC1.jpg');
            expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=1800');
            expect(res.redirect).toHaveBeenCalledWith('https://example.com/thumb.jpg');
        });

        test('returns 404 when the underlying photo does not exist', async () => {
            galleryService.isValidPhotoKey.mockReturnValue(true);
            galleryService.getOrCreatePreviewUrl.mockRejectedValue({ name: 'NoSuchKey' });
            const req = { query: { key: 'Outlaws 09-06/_DSC1.jpg' } };
            const res = mockRes();

            await galleryController.getPreview(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'Photo not found' });
        });
    });

    describe('getDownload', () => {
        test('returns 401 with no auth', async () => {
            const req = { auth: {}, query: { key: 'x/y.jpg' } };
            const res = mockRes();

            await galleryController.getDownload(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('returns 401 when the JWT has no matching users row', async () => {
            userService.getUserRolesByAuth0Id.mockResolvedValue(null);
            const req = { auth: { payload: { sub: 'auth0|123' } }, query: { key: 'x/y.jpg' } };
            const res = mockRes();

            await galleryController.getDownload(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
        });

        test('returns 400 for an invalid key even when authenticated', async () => {
            userService.getUserRolesByAuth0Id.mockResolvedValue({ id: 1 });
            galleryService.isValidPhotoKey.mockReturnValue(false);
            const req = { auth: { payload: { sub: 'auth0|123' } }, query: { key: '../x' } };
            const res = mockRes();

            await galleryController.getDownload(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        test('returns the download url for a valid authenticated request', async () => {
            userService.getUserRolesByAuth0Id.mockResolvedValue({ id: 1 });
            galleryService.isValidPhotoKey.mockReturnValue(true);
            galleryService.getDownloadUrl.mockResolvedValue('https://example.com/original.jpg');
            const req = { auth: { payload: { sub: 'auth0|123' } }, query: { key: 'Outlaws 09-06/_DSC1.jpg' } };
            const res = mockRes();

            await galleryController.getDownload(req, res);

            expect(galleryService.getDownloadUrl).toHaveBeenCalledWith('Outlaws 09-06/_DSC1.jpg');
            expect(res.json).toHaveBeenCalledWith({ url: 'https://example.com/original.jpg' });
        });
    });
});
