describe('galleryService.getResizedImageUri', () => {
  const originalEnv = process.env.EXPO_PUBLIC_IMAGE_DOMAIN;
  const loadService = () => {
    let service: typeof import('@/services/galleryService');
    jest.isolateModules(() => {
      service = require('../../services/galleryService');
    });
    return service!;
  };

  beforeEach(() => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_IMAGE_DOMAIN = 'media.example.com';
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_IMAGE_DOMAIN = originalEnv;
  });

  it('rewrites supported R2 urls to the Cloudflare resize endpoint', async () => {
    const { getResizedImageUri } = loadService();

    expect(getResizedImageUri('https://media.example.com/uploads/image.png', 600)).toBe(
      'https://media.example.com/cdn-cgi/image/width=600,quality=80,format=auto,onerror=redirect/uploads/image.png'
    );
  });

  it('leaves unsupported urls unchanged', async () => {
    const { getResizedImageUri } = loadService();

    expect(getResizedImageUri('https://example.com/image.png', 600)).toBe('https://example.com/image.png');
    expect(getResizedImageUri('', 600)).toBe('');
  });
});