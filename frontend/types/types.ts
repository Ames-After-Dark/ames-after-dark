import { ImageSourcePropType } from 'react-native';

export interface Friend {
    id: string | number;
    username?: string;
    name?: string;
    email?: string;
    bio?: string;
    status?: 'Online' | 'Offline';
    mutualFriends?: number;
    avatar?: ImageSourcePropType;
}

export interface FriendReference {
    id: string;
    name: string;
    status: 'Online' | 'Offline';
    mutualFriends: number;
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

// added here from bars
export type TimeRule =
    |   {
            kind: "one-time";
            start: string;
            end: string;
            tz: string;
        }
    |   {
            kind: "weekly";
            tz: string;
            daysOfWeek: number[];
            startLocalTime: string;
            endLocalTime: string;
        };