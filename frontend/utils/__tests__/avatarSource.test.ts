import { resolveAvatarSource } from '../avatarSource';
import { getAvatarById } from '@/utils/profileAssets';

jest.mock('@/utils/profileAssets', () => ({
  getAvatarById: jest.fn(),
}));

describe('resolveAvatarSource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAvatarById as jest.Mock).mockReturnValue({ source: { uri: 'avatar-7.png' } });
  });

  it('returns a remote url when one is provided', () => {
    expect(resolveAvatarSource({ avatar: 'https://cdn.example.com/avatar.png' })).toEqual({ uri: 'https://cdn.example.com/avatar.png' });
  });

  it('resolves bundled assets through the avatar id fallback', () => {
    expect(resolveAvatarSource({ profile_photo_id: 7 })).toEqual({ uri: 'avatar-7.png' });
    expect(getAvatarById).toHaveBeenCalledWith(7);
  });

  it('passes through a numeric static asset and falls back to the app logo otherwise', () => {
    expect(resolveAvatarSource({ avatar: 123 as any })).toBe(123);
    expect(resolveAvatarSource({})).toEqual(expect.anything());
  });
});