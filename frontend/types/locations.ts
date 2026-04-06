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
    name: string;
    username: string;
    profile_pic_url?: string;
    profile_photo_id?: number;
    avatar?: any;
    atBarName?: string;
    // Add the new key here:
    location?: {
        latitude: string | number;
        longitude: string | number;
        updated_at: string;
        user_id: number;
    };
    // Keep this for backward compatibility if needed:
    user_locations?: {
        latitude: string | number;
        longitude: string | number;
        updated_at: string;
        user_id: number;
    };
}

export interface GroupLocation {
    bar: BarLocation;
    sourceBarId?: string | number;
    friends: FriendLocation[];
}