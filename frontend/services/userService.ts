import { apiFetch } from './apiClient';
import { Friend } from '@/types/types';

export interface PendingFriendRequest {
  user_id_1: number;
  user_id_2: number;
  friendship_status_id: number;
  users_friendships_user_id_1Tousers?: Friend;
  users_friendships_user_id_2Tousers?: Friend;
}

export async function sendFriendRequest(userId: string | number, friendId: string | number) {
  try {
    return await apiFetch(`/friendships/${userId}/friends/${friendId}`, {
      method: 'POST'
    });
  } catch (error) {
    console.error(`Failed to send friend request from ${userId} to ${friendId}:`, error);
    throw error;
  }
}

export async function getPendingFriendRequests(userId: string | number): Promise<PendingFriendRequest[]> {
  try {
    const requests = await apiFetch(`/friendships/${userId}/friend-requests`);
    return Array.isArray(requests) ? requests : [];
  } catch (error) {
    console.error(`Failed to fetch pending friend requests for user ${userId}:`, error);
    throw error;
  }
}

export async function acceptFriendRequest(userId: string | number, friendId: string | number) {
  try {
    return await apiFetch(`/friendships/${userId}/friends/${friendId}/accept`, {
      method: 'POST'
    });
  } catch (error) {
    console.error(`Failed to accept friend request between ${userId} and ${friendId}:`, error);
    throw error;
  }
}

export async function declineFriendRequest(userId: string | number, friendId: string | number) {
  try {
    return await apiFetch(`/friendships/${userId}/friends/${friendId}/decline`, {
      method: 'POST'
    });
  } catch (error) {
    console.error(`Failed to decline friend request between ${userId} and ${friendId}:`, error);
    throw error;
  }
}

export async function blockFriend(userId: string | number, friendId: string | number) {
  try {
    return await apiFetch(`/friendships/${userId}/friends/${friendId}/block`, {
      method: 'POST'
    });
  } catch (error) {
    console.error(`Failed to block user between ${userId} and ${friendId}:`, error);
    throw error;
  }
}

export async function removeFriend(userId: string | number, friendId: string | number) {
  try {
    return await apiFetch(`/friendships/${userId}/friends/${friendId}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Failed to remove friend between ${userId} and ${friendId}:`, error);
    throw error;
  }
}

export async function getUserFriends(userId: string | number): Promise<Friend[]> {
  try {
    const friends = await apiFetch(`/friendships/${userId}/friends`);
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

/**
 * Updates a user data
 * option to update username, bio or email
 * can send any individually or together
 */
export interface UpdateUserPayload {
  username?: string;
  bio?: string;
  email?: string;
}

export const updateUser = async (
  userId: string | number,
  updates: UpdateUserPayload
) => {
  // Remove undefined fields
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );

  // Call apiFetch (it should already handle JSON + errors)
  const data = await apiFetch(`/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filteredUpdates),
  });

  return data;
};


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

// Auth0 endpoints
export interface UserStatus {
  registered: boolean;
  profileComplete: boolean;
  requiresRegistration: boolean;
  userId?: number;
  user?: {
    id: number;
    email: string | null;
    name: string | null;
    hasPhoneNumber: boolean;
    hasBirthday: boolean;
  };
}

export interface CompleteRegistrationData {
  phoneNumber: string;
  birthday: string; // YYYY-MM-DD format
  username: string;
}

export interface CompleteRegistrationResponse {
  message: string;
  user: {
    id: number;
    email: string | null;
    name: string | null;
    username: string;
    phoneNumber: string;
    birthday: string;
  };
}

/**
 * Check if the authenticated user is registered and has completed their profile
 * Requires Auth0 authentication
 */
export async function checkUserStatus(accessToken: string): Promise<UserStatus> {
  try {
    const status = await apiFetch(`/users/auth/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return status;
  } catch (error) {
    console.error('Failed to check user status:', error);
    throw error;
  }
}

/**
 * Complete user registration with phone number and birthday
 * Requires Auth0 authentication
 */
export async function completeUserRegistration(
  accessToken: string,
  data: CompleteRegistrationData
): Promise<CompleteRegistrationResponse> {
  try {
    const response = await apiFetch(`/users/auth/register`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response;
  } catch (error) {
    console.error('Failed to complete user registration:', error);
    throw error;
  }
}

/**
 * Check if a username is available
 * Public endpoint - no authentication required
 */
export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; username: string }> {
  try {
    const response = await apiFetch(`/users/auth/check-username?username=${encodeURIComponent(username)}`, {
      method: 'GET'
    });
    return response;
  } catch (error) {
    console.error('Failed to check username availability:', error);
    throw error;
  }
}

/**
 * Get username for the authenticated user
 * Requires Auth0 authentication
 * Returns { username: string | null } - null if user hasn't set username yet
 */
export async function getUsernameByAuth(accessToken: string): Promise<{ username: string | null }> {
  const response = await apiFetch(`/users/auth/username`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  return response;
}
