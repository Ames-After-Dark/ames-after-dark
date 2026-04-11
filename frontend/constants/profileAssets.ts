import { ImageSourcePropType } from 'react-native';

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE ASSET MAP
// Maps database integer IDs to local image requires.
// When new avatars or drinks are added to the DB, just add them here.
// IDs match the app.user_profile_photos and app.drinks tables.
// Default for both is ID 2 (first real record, ID 1 is a test record).
// ─────────────────────────────────────────────────────────────────────────────

export type ProfileAsset = {
    id: number;
    source: ImageSourcePropType;
};

// ── Avatars ──────────────────────────────────────────────────────────────────
export const AVATAR_OPTIONS: ProfileAsset[] = [
    { id: 2, source: require('@/assets/images/avatars/Boy_1.png') },
    { id: 3, source: require('@/assets/images/avatars/Boy_2.png') },
    { id: 4, source: require('@/assets/images/avatars/Boy_3.png') },
    { id: 5, source: require('@/assets/images/avatars/Boy_4.png') },
    { id: 6, source: require('@/assets/images/avatars/Boy_5.png') },
    { id: 7, source: require('@/assets/images/avatars/Boy_6.png') },
    { id: 8, source: require('@/assets/images/avatars/Boy_7.png') },
    { id: 9, source: require('@/assets/images/avatars/Boy_8.png') },
    { id: 10, source: require('@/assets/images/avatars/Boy_9.png') },
    { id: 11, source: require('@/assets/images/avatars/Boy_10.png') },
    { id: 12, source: require('@/assets/images/avatars/Girl_1.png') },
    { id: 13, source: require('@/assets/images/avatars/Girl_2.png') },
    { id: 14, source: require('@/assets/images/avatars/Girl_3.png') },
    { id: 15, source: require('@/assets/images/avatars/Girl_4.png') },
    { id: 16, source: require('@/assets/images/avatars/Girl_5.png') },
    { id: 17, source: require('@/assets/images/avatars/Girl_6.png') },
    { id: 18, source: require('@/assets/images/avatars/Girl_7.png') },
    { id: 19, source: require('@/assets/images/avatars/Girl_8.png') },
    { id: 20, source: require('@/assets/images/avatars/Girl_9.png') },
    { id: 21, source: require('@/assets/images/avatars/Girl_10.png') },
];

export const DEFAULT_AVATAR_ID = 2;

// ── Drinks ───────────────────────────────────────────────────────────────────
export const DRINK_OPTIONS: ProfileAsset[] = [
    { id: 2, source: require('@/assets/images/drinks/01.png') },
    { id: 3, source: require('@/assets/images/drinks/02.png') },
    { id: 4, source: require('@/assets/images/drinks/03.png') },
    { id: 5, source: require('@/assets/images/drinks/04.png') },
    { id: 6, source: require('@/assets/images/drinks/05.png') },
    { id: 7, source: require('@/assets/images/drinks/06.png') },
    { id: 8, source: require('@/assets/images/drinks/07.png') },
    { id: 9, source: require('@/assets/images/drinks/08.png') },
    { id: 10, source: require('@/assets/images/drinks/09.png') },
    { id: 11, source: require('@/assets/images/drinks/10.png') },
    { id: 12, source: require('@/assets/images/drinks/11.png') },
    { id: 13, source: require('@/assets/images/drinks/12.png') },
    { id: 14, source: require('@/assets/images/drinks/13.png') },
    { id: 15, source: require('@/assets/images/drinks/14.png') },
    { id: 16, source: require('@/assets/images/drinks/15.png') },
    { id: 17, source: require('@/assets/images/drinks/16.png') },
    { id: 18, source: require('@/assets/images/drinks/17.png') },
];

export const DEFAULT_DRINK_ID = 2;

// ── Helpers ───────────────────────────────────────────────────────────────────
export const getAvatarById = (id: number | null | undefined): ProfileAsset => {
    const found = AVATAR_OPTIONS.find(a => a.id === (id ?? DEFAULT_AVATAR_ID));
    return found ?? AVATAR_OPTIONS[0];
};

export const getDrinkById = (id: number | null | undefined): ProfileAsset => {
    const found = DRINK_OPTIONS.find(d => d.id === (id ?? DEFAULT_DRINK_ID));
    return found ?? DRINK_OPTIONS[0];
};
