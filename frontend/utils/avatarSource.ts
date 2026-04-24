import type { ImageSourcePropType } from 'react-native';
import { getAvatarById } from '@/utils/profileAssets';

const BUNDLED_AVATAR_PATHS: Record<string, ImageSourcePropType> = {
    'assets/images/avatars/Girl_1.png': require('@/assets/images/avatars/Girl_1.png'),
    'assets/images/avatars/Girl_2.png': require('@/assets/images/avatars/Girl_2.png'),
    'assets/images/avatars/Girl_3.png': require('@/assets/images/avatars/Girl_3.png'),
    'assets/images/avatars/Girl_4.png': require('@/assets/images/avatars/Girl_4.png'),
    'assets/images/avatars/Girl_5.png': require('@/assets/images/avatars/Girl_5.png'),
    'assets/images/avatars/Girl_6.png': require('@/assets/images/avatars/Girl_6.png'),
    'assets/images/avatars/Girl_7.png': require('@/assets/images/avatars/Girl_7.png'),
    'assets/images/avatars/Girl_8.png': require('@/assets/images/avatars/Girl_8.png'),
    'assets/images/avatars/Girl_9.png': require('@/assets/images/avatars/Girl_9.png'),
    'assets/images/avatars/Girl_10.png': require('@/assets/images/avatars/Girl_10.png'),
    'assets/images/avatars/Boy_1.png': require('@/assets/images/avatars/Boy_1.png'),
    'assets/images/avatars/Boy_2.png': require('@/assets/images/avatars/Boy_2.png'),
    'assets/images/avatars/Boy_3.png': require('@/assets/images/avatars/Boy_3.png'),
    'assets/images/avatars/Boy_4.png': require('@/assets/images/avatars/Boy_4.png'),
    'assets/images/avatars/Boy_5.png': require('@/assets/images/avatars/Boy_5.png'),
    'assets/images/avatars/Boy_6.png': require('@/assets/images/avatars/Boy_6.png'),
    'assets/images/avatars/Boy_7.png': require('@/assets/images/avatars/Boy_7.png'),
    'assets/images/avatars/Boy_8.png': require('@/assets/images/avatars/Boy_8.png'),
    'assets/images/avatars/Boy_9.png': require('@/assets/images/avatars/Boy_9.png'),
    'assets/images/avatars/Boy_10.png': require('@/assets/images/avatars/Boy_10.png'),
};

/**
 * Unified avatar resolver:
 * 1) If a remote URL exists, use it.
 * 2) Else if a profile_photo_id exists, use the bundled asset.
 * 3) Else fall back to the app logo.
 */
export function resolveAvatarSource(input: {
    avatar?: unknown;
    profile_photo_id?: number | null | undefined;
    profile_picture_url?: string | null | undefined;
}): ImageSourcePropType {
    const urlCandidate =
        (typeof input.avatar === 'string' && input.avatar) ||
        (typeof input.profile_picture_url === 'string' && input.profile_picture_url) ||
        (typeof (input.avatar as any)?.uri === 'string' && (input.avatar as any).uri);

    const url = typeof urlCandidate === 'string' ? urlCandidate.trim() : '';

    // Support bundled avatar paths coming back from the API (e.g. "assets/images/avatars/Girl_1.png")
    if (url && BUNDLED_AVATAR_PATHS[url]) return BUNDLED_AVATAR_PATHS[url];
    const isValidRemoteUrl =
        url.length > 0 &&
        url !== 'null' &&
        url !== 'undefined' &&
        (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://'));

    if (isValidRemoteUrl) return { uri: url };

    if (typeof input.profile_photo_id === 'number') {
        return getAvatarById(input.profile_photo_id).source;
    }

    // If avatar is already a static require() (number) or ImageSourcePropType object, keep it.
    if (typeof input.avatar === 'number') {
        return input.avatar as any;
    }

    // Default
    return require('@/assets/images/Logo.png');
}
