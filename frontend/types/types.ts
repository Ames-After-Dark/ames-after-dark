import { ImageSourcePropType } from 'react-native';

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