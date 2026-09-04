// backend/src/lib/__tests__/r2Storage.test.js
const { isListablePhotoKey } = require('../r2Storage');

describe('isListablePhotoKey', () => {
    test('accepts a normal photo key', () => {
        expect(isListablePhotoKey('Outlaws 09-06/_DSC1234.jpg')).toBe(true);
    });

    test('rejects a hidden_ key', () => {
        expect(isListablePhotoKey('Outlaws 09-06/hidden__DSC1234.jpg')).toBe(false);
    });

    test('rejects a thumb_ key', () => {
        expect(isListablePhotoKey('Outlaws 09-06/thumb__DSC1234.jpg')).toBe(false);
    });

    test('rejects a non-image extension', () => {
        expect(isListablePhotoKey('Outlaws 09-06/notes.txt')).toBe(false);
    });
});
