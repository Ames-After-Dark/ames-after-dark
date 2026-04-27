import { ImageSourcePropType } from 'react-native';

export interface Friend {
    id: string | number;
    username?: string;
    name?: string;
    email?: string;
    bio?: string;
    status?: 'Online' | 'Offline';
    mutualFriends?: number;
    /**
     * Back-compat display image.
     * Historically this has been an ImageSourcePropType, but some call sites treat it like a string URL.
     */
    avatar?: ImageSourcePropType | string | { uri: string };

    /**
     * Preferred avatar: maps to a bundled image via `getAvatarById()`.
     */
    profile_photo_id?: number | null;
}

export interface FriendReference {
    id: string;
    name: string;
    status: 'Online' | 'Offline';
    mutualFriends: number;
}

export interface PendingFriendRequest {
    user_id_1: number;
    user_id_2: number;
    friendship_status_id: number;
    users_friendships_user_id_1Tousers?: Friend;
    users_friendships_user_id_2Tousers?: Friend;
}

export interface UserProfile {
    name: string;
    email: string;
    avatar: ImageSourcePropType;
    bio: string;
    friends: FriendReference[];
}

export type UserDatabase = {
    [key: string]: UserProfile;
};

export interface OccurrenceRow {
  start_time_utc: string | Date;
  end_time_utc: string | Date;
}

// added here from bars
export type TimeRule =
    | {
        kind: "one-time";
        start: string;
        end: string;
        tz: string;
    }
    | {
        kind: "weekly";
        tz: string;
        daysOfWeek: number[];
        startLocalTime: string;
        endLocalTime: string;
    };