import { apiFetch } from "./apiClient";

export interface UserLocationData {
    latitude: number;
    longitude: number;
}

export const UserLocationService = {
    /**
     * Updates the current user's location in the database
     */
    updateLocation: async (userId: number, data: UserLocationData) => {
        return await apiFetch(`/userlocations/${userId}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    /**
     * Optional: Fetches other users' locations for the map
     */
    // getAllLocations: async () => {
    //     return await apiFetch(`/userlocations`);
    // }
};

export const FriendLocationService = {
    getFriendsLocations: async (userId: number) => {
        const data = await apiFetch(`/friendships/${userId}/friends/locations`);

        // Flatten the two Prisma lists into one array of friend objects
        const list1 = data.friendships_friendships_user_id_1Tousers.map((f: any) => f.users_friendships_user_id_2Tousers);
        const list2 = data.friendships_friendships_user_id_2Tousers.map((f: any) => f.users_friendships_user_id_1Tousers);

        return [...list1, ...list2];
    }
};