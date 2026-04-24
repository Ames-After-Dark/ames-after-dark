import type { ImageSourcePropType } from 'react-native';
import { getAvatarById } from '@/utils/profileAssets';

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
