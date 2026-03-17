export interface BarLocation {
    id: string | number;
    name: string;
    address?: string;
    hours?: string;
    logo?: any;
    latitude: number;
    longitude: number;
}

export interface FriendLocation {
    id: number;
    username: string;
    name: string;
    profile_pic_url?: string;
    user_locations?: {
        latitude: number;
        longitude: number;
        updated_at: string;
    } | null;
}

export interface GroupLocation {
    bar: BarLocation;
    friends: FriendLocation[];
}