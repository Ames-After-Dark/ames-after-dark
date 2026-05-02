import { AVATAR_OPTIONS, DRINK_OPTIONS, DEFAULT_AVATAR_ID, DEFAULT_DRINK_ID, getAvatarById, getDrinkById } from '../profileAssets';

describe('profileAssets', () => {
  it('returns the requested avatar asset when the id exists', () => {
    expect(getAvatarById(3)).toEqual(AVATAR_OPTIONS[2]);
  });

  it('falls back to the default avatar when the id is missing or invalid', () => {
    expect(getAvatarById(undefined)).toEqual(AVATAR_OPTIONS[DEFAULT_AVATAR_ID - 1]);
    expect(getAvatarById(999)).toEqual(AVATAR_OPTIONS[0]);
  });

  it('returns the requested drink asset and falls back to the default drink', () => {
    expect(getDrinkById(2)).toEqual(DRINK_OPTIONS[1]);
    expect(getDrinkById(null)).toEqual(DRINK_OPTIONS[DEFAULT_DRINK_ID - 1]);
  });
});