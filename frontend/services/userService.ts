import { apiFetch } from './apiClient';
import { Friend } from '@/types/types';

export async function getUserFriends(userId: string | number): Promise<Friend[]> {
  try {
    const friends = await apiFetch(`/users/${userId}/friends`);
    return Array.isArray(friends) ? friends : [];
  } catch (error) {
    console.error(`Failed to fetch friends for user ${userId}:`, error);
    throw error;
  }
}

export async function getUserById(userId: string | number) {
  try {
    const user = await apiFetch(`/users/${userId}`);
    return user;
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
    throw error;
  }
}

export async function getMutualFriends(viewerId: string | number, profileId: string | number): Promise<Friend[]> {
  try {
    // Fetch both lists in parallel for better performance
    const [viewerFriends, profileFriends] = await Promise.all([
      getUserFriends(viewerId),
      getUserFriends(profileId)
    ]);

    // Create a Set of viewer friend IDs for O(1) lookup time
    const viewerFriendIds = new Set(viewerFriends.map(f => f.id));

    // Filter profile friends to only include those in the viewer's list
    const mutual = profileFriends.filter(f => viewerFriendIds.has(f.id));

    return mutual;
  } catch (error) {
    console.error(`Failed to calculate mutual friends between ${viewerId} and ${profileId}:`, error);
    return []; // Return empty array on failure to avoid breaking the UI
  }
}

// TEMP_AUTH_START - Remove when re-enabling Auth0
export async function loginUser(username: string) {
  try {
    const user = await apiFetch(`/users/login`, {
      method: 'POST',
      body: JSON.stringify({ username })
    });
    return user;
  } catch (error) {
    console.error(`Failed to login user ${username}:`, error);
    throw error;
  }
}

export async function signupUser(username: string) {
  try {
    const user = await apiFetch(`/users/signup`, {
      method: 'POST',
      body: JSON.stringify({ username })
    });
    return user;
  } catch (error) {
    console.error(`Failed to signup user ${username}:`, error);
    throw error;
  }
}
// TEMP_AUTH_END
