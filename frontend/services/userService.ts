import { apiFetch, apiFetchAuth } from './apiClient';
import { Friend, PendingFriendRequest } from '@/types/types';


export async function sendFriendRequest(token: string, friendId: string | number) {
  try {
    return await apiFetchAuth(`/friendships/friends/${friendId}`, token, {
      method: 'POST'
    });
  } catch (error) {
    console.error(`Failed to send friend request to ${friendId}:`, error);
    throw error;
  }
}

export async function getPendingFriendRequests(token: string): Promise<PendingFriendRequest[]> {
  try {
    const requests = await apiFetchAuth(`/friendships/friend-requests`, token);
    return Array.isArray(requests) ? requests : [];
  } catch (error) {
    console.error(`Failed to fetch pending friend requests:`, error);
    throw error;
  }
}

export async function getRecommendedFriends(token: string, limit: number = 5): Promise<Friend[]> {
  try {
    const recommendations = await apiFetchAuth(`/friendships/recommended-friends?limit=${limit}`, token);
    return Array.isArray(recommendations) ? recommendations : [];
  } catch (error) {
    console.error(`Failed to fetch recommended friends:`, error);
    throw error;
  }
}

export async function acceptFriendRequest(token: string, friendId: string | number) {
  try {
    return await apiFetchAuth(`/friendships/friends/${friendId}/accept`, token, {
      method: 'POST'
    });
  } catch (error) {
    console.error(`Failed to accept friend request with ${friendId}:`, error);
    throw error;
  }
}

export async function declineFriendRequest(token: string, friendId: string | number) {
  try {
    return await apiFetchAuth(`/friendships/friends/${friendId}/decline`, token, {
      method: 'POST'
    });
  } catch (error) {
    console.error(`Failed to decline friend request with ${friendId}:`, error);
    throw error;
  }
}

export async function blockFriend(token: string, friendId: string | number) {
  try {
    return await apiFetchAuth(`/friendships/friends/${friendId}/block`, token, {
      method: 'POST'
    });
  } catch (error) {
    console.error(`Failed to block user ${friendId}:`, error);
    throw error;
  }
}

export async function removeFriend(token: string, friendId: string | number) {
  try {
    return await apiFetchAuth(`/friendships/friends/${friendId}`, token, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error(`Failed to remove friend ${friendId}:`, error);
    throw error;
  }
}

export async function getUserFriends(token: string): Promise<Friend[]> {
  try {
    const friends = await apiFetchAuth(`/friendships/friends`, token);

    if (!Array.isArray(friends)) return [];

    // Map the returned database fields into the Friend frontend format
    return friends.map((user: any) => ({
      id: user.id,
      username: user.username,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || undefined,
      bio: user.bio,
      avatar: user.profile_picture_url ? { uri: user.profile_picture_url } : undefined,
    }));
  } catch (error) {
    console.error(`Failed to fetch friends:`, error);
    throw error;
  }
}

export async function searchUsers(token: string, query: string, excludeUserId?: string | number): Promise<Friend[]> {
  try {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const searchParam = encodeURIComponent(trimmed);
    const excludeParam = excludeUserId !== undefined
      ? `&excludeUserId=${encodeURIComponent(String(excludeUserId))}`
      : '';

    const results = await apiFetchAuth(`/users/search?search=${searchParam}${excludeParam}`, token);
    if (!Array.isArray(results)) return [];

    return results.map((user: any) => ({
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatar: user.profile_photo?.image_url || undefined,
    }));
  } catch (error) {
    console.error(`Failed to search users for query ${query}:`, error);
    throw error;
  }
}

export async function getUserById(token: string, userId: string | number) {
  try {
    const user = await apiFetchAuth(`/users/${userId}`, token);
    return user;
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error);
    throw error;
  }
}

export async function getCurrentUser(token: string) {
  try {
    const user = await apiFetchAuth(`/users/me`, token);
    return user;
  } catch (error) {
    console.error(`Failed to fetch current user:`, error);
    throw error;
  }
}

/**
 * Creates basic user profile internally during registration.
 * This is separate from Auth0 registration and is used to initialize
 * the user profile in our database.
 */
export async function createUserProfile(token: string, profileData: {
  username: string;
  bio?: string;
  email?: string;
}): Promise<{ id: number }> {
  try {
    const response = await apiFetchAuth(`/users`, token, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
    return response;
  } catch (error) {
    console.error('Failed to create user profile:', error);
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
  token: string,
  userId: string | number,
  updates: UpdateUserPayload
) => {
  // Remove undefined fields
  const filteredUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, value]) => value !== undefined)
  );

  // Call apiFetch (it should already handle JSON + errors)
  const data = await apiFetchAuth(`/users/${userId}`, token, {
    method: "PUT",
    body: JSON.stringify(filteredUpdates),
  });

  return data;
};


export async function getMutualFriends(token: string, profileId: string | number): Promise<Friend[]> {
  try {
    const mutual = await apiFetchAuth(`/friendships/mutual-friends/${profileId}`, token);
    return Array.isArray(mutual) ? mutual : [];
  } catch (error) {
    console.error(`Failed to calculate mutual friends for profile ${profileId}:`, error);
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
    hasUsername?: boolean;
    hasName?: boolean;
  };
}

export interface CompleteRegistrationData {
  phoneNumber?: string;
  birthday?: string; // YYYY-MM-DD format
  username?: string;
  name?: string;
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
 * Cancel user registration (deletes Auth0 account)
 * Requires Auth0 authentication
 */
export async function cancelRegistration(accessToken: string): Promise<{ message: string }> {
  try {
    const response = await apiFetch(`/users/auth/cancel-registration`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response;
  } catch (error) {
    console.error('Failed to cancel user registration:', error);
    throw error;
  }
}

/**
 * Get username for the authenticated user
 * Requires Auth0 authentication
 * Returns { username: string | null } - null if user hasn't set username yet
 */
export async function getUsernameByAuth(accessToken: string): Promise<{ hasUsername: boolean, username: string | null }> {
  const response = await apiFetch(`/users/auth/username`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  return response;
}

/**
 * Update username for the authenticated user
 * Requires Auth0 authentication
 */
export async function updateUsernameByAuth(accessToken: string, username: string): Promise<{ message: string; username: string }> {
  try {
    const response = await apiFetch(`/users/auth/username`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });
    return response;
  } catch (error) {
    console.error('Failed to update username:', error);
    throw error;
  }
}

/**
 * Get user profile for the authenticated user
 * Requires Auth0 authentication
 * Returns full user profile including bio, username, email, etc.
 */
export async function getUserProfileByAuth(accessToken: string): Promise<{
  id: number;
  username: string | null;
  email: string | null;
  name: string | null;
  bio: string | null;
  phoneNumber: string | null;
  birthday: string | null;
  createdAt: string;
}> {
  try {
    const response = await apiFetch(`/users/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    throw error;
  }
}

/**
 * Update bio for the authenticated user
 * Requires Auth0 authentication
 */
export async function updateBioByAuth(accessToken: string, bio: string): Promise<{ message: string; bio: string | null }> {
  try {
    const response = await apiFetch(`/users/auth/bio`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bio })
    });
    return response;
  } catch (error) {
    console.error('Failed to update bio:', error);
    throw error;
  }
}

export async function deleteAccount(accessToken: string): Promise<{ message: string }> {
  try {
    const response = await apiFetch(`/users/auth/account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response;
  } catch (error) {
    console.error('Failed to delete account:', error);
    throw error;
  }
}

export const toggleGhostMode = async (currentUserId: number, token: string, isGhostModeNow: boolean) => {
  const allFriends = await getUserFriends(token);
  const nextVisibility = !isGhostModeNow;

  return Promise.all(
    allFriends.map((friend) =>
      apiFetch(`/userlocations/permissions/${friend.id}`, {
        method: 'POST',
        body: JSON.stringify({
          ownerId: currentUserId,
          enabled: nextVisibility,
        }),
      })
    )
  );
}
