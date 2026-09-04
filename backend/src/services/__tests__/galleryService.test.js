const actualR2Storage = jest.requireActual('../../lib/r2Storage');

const mockR2Storage = {
    s3: { send: jest.fn() },
    CLOUDFLARE_R2_BUCKET: 'test-bucket',
    signedUrlForKey: jest.fn(),
    objectExists: jest.fn(),
    parseFolderName: actualR2Storage.parseFolderName,
    parseDateStr: actualR2Storage.parseDateStr,
};

jest.mock('../../lib/r2Storage', () => mockR2Storage);

const mockGetSignedUrl = jest.fn();
jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: (...args) => mockGetSignedUrl(...args),
}));

const mockSharpInstance = {
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn(),
};
jest.mock('sharp', () => jest.fn(() => mockSharpInstance));

const galleryService = require('../galleryService');

describe('galleryService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('isValidPhotoKey', () => {
        test('accepts a well-formed key', () => {
            expect(galleryService.isValidPhotoKey('Outlaws 09-06/_DSC1234.jpg')).toBe(true);
        });

        test('rejects a key containing ..', () => {
            expect(galleryService.isValidPhotoKey('../etc/passwd.jpg')).toBe(false);
        });

        test('rejects a key with the wrong number of path segments', () => {
            expect(galleryService.isValidPhotoKey('a/b/c.jpg')).toBe(false);
            expect(galleryService.isValidPhotoKey('c.jpg')).toBe(false);
        });

        test('rejects a disallowed extension', () => {
            expect(galleryService.isValidPhotoKey('Outlaws 09-06/notes.txt')).toBe(false);
        });

        test('rejects a key whose filename is already a thumb_ or hidden_ file', () => {
            expect(galleryService.isValidPhotoKey('Outlaws 09-06/thumb__DSC1234.jpg')).toBe(false);
            expect(galleryService.isValidPhotoKey('Outlaws 09-06/hidden__DSC1234.jpg')).toBe(false);
        });

        test('rejects a bare filename with no dot at all, even if it matches an allowed extension token', () => {
            expect(galleryService.isValidPhotoKey('someFolder/jpg')).toBe(false);
        });

        test('rejects a filename that is just a dot with nothing after it', () => {
            expect(galleryService.isValidPhotoKey('someFolder/.')).toBe(false);
        });

        test('rejects a filename starting with a dot and nothing meaningful before the extension', () => {
            expect(galleryService.isValidPhotoKey('someFolder/.jpg')).toBe(false);
        });

        test('rejects a key whose folder does not look like a real album (no date)', () => {
            expect(galleryService.isValidPhotoKey('photographer-photos/12.jpg')).toBe(false);
        });

        test('accepts a key whose folder does look like a real album', () => {
            expect(galleryService.isValidPhotoKey('Outlaws 09-06/_DSC1.jpg')).toBe(true);
        });
    });

    describe('getOrCreatePreviewUrl', () => {
        test('returns the existing thumbnail URL without regenerating it', async () => {
            mockR2Storage.objectExists.mockResolvedValue(true);
            mockR2Storage.signedUrlForKey.mockResolvedValue('https://example.com/thumb.jpg');

            const url = await galleryService.getOrCreatePreviewUrl('Outlaws 09-06/_DSC1.jpg');

            expect(mockR2Storage.objectExists).toHaveBeenCalledWith('Outlaws 09-06/thumb__DSC1.jpg');
            expect(mockR2Storage.s3.send).not.toHaveBeenCalled();
            expect(mockR2Storage.signedUrlForKey).toHaveBeenCalledWith('Outlaws 09-06/thumb__DSC1.jpg');
            expect(url).toBe('https://example.com/thumb.jpg');
        });

        test('downloads, resizes, and uploads a new thumbnail when none exists yet', async () => {
            mockR2Storage.objectExists.mockResolvedValue(false);
            mockR2Storage.s3.send
                .mockResolvedValueOnce({ Body: (async function* () { yield Buffer.from('original-bytes'); })() })
                .mockResolvedValueOnce({});
            mockSharpInstance.toBuffer.mockResolvedValue(Buffer.from('resized-bytes'));
            mockR2Storage.signedUrlForKey.mockResolvedValue('https://example.com/thumb.jpg');

            const url = await galleryService.getOrCreatePreviewUrl('Outlaws 09-06/_DSC1.jpg');

            expect(mockR2Storage.s3.send).toHaveBeenCalledTimes(2);
            const getCall = mockR2Storage.s3.send.mock.calls[0][0];
            expect(getCall.input).toMatchObject({ Bucket: 'test-bucket', Key: 'Outlaws 09-06/_DSC1.jpg' });

            expect(mockSharpInstance.resize).toHaveBeenCalledWith({ width: 700, withoutEnlargement: true });
            expect(mockSharpInstance.jpeg).toHaveBeenCalledWith({ quality: 70 });

            const putCall = mockR2Storage.s3.send.mock.calls[1][0];
            expect(putCall.input).toMatchObject({
                Bucket: 'test-bucket',
                Key: 'Outlaws 09-06/thumb__DSC1.jpg',
                ContentType: 'image/jpeg',
            });
            expect(putCall.input.Body).toEqual(Buffer.from('resized-bytes'));

            expect(url).toBe('https://example.com/thumb.jpg');
        });
    });

    describe('getDownloadUrl', () => {
        test('signs the original key with an attachment content-disposition', async () => {
            mockGetSignedUrl.mockResolvedValue('https://example.com/original.jpg');

            const url = await galleryService.getDownloadUrl('Outlaws 09-06/_DSC1.jpg');

            expect(mockGetSignedUrl).toHaveBeenCalled();
            const [, command] = mockGetSignedUrl.mock.calls[0];
            expect(command.input).toMatchObject({
                Bucket: 'test-bucket',
                Key: 'Outlaws 09-06/_DSC1.jpg',
                ResponseContentDisposition: 'attachment; filename="_DSC1.jpg"',
            });
            expect(url).toBe('https://example.com/original.jpg');
        });
    });
});
