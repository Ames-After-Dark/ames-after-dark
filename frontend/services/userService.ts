import { apiFetch } from './apiClient';
import { Friend, PendingFriendRequest } from '@/types/types';


export async function sendFriendRequest(token: string, friendId: string | number) {
  try {
    return await apiFetch(`/friendships/friends/${friendId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
  } catch (error) {
    console.error(`Failed to send friend request from to ${friendId}:`, error);
    throw error;
  }
}

export async function getPendingFriendRequests(token: string): Promise<PendingFriendRequest[]> {
  try {
    const requests = await apiFetch(`/friendships/friend-requests`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return Array.isArray(requests) ? requests : [];
  } catch (error) {
    console.error(`Failed to fetch pending friend requests:`, error);
    throw error;
  }
}

export async function getRecommendedFriends(token: string, limit: number = 5): Promise<Friend[]> {
  try {
    const recommendations = await apiFetch(`/friendships/recommended-friends?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return Array.isArray(recommendations) ? recommendations : [];
  } catch (error) {
    console.error(`Failed to fetch recommended friends:`, error);
    throw error;
  }
}

export async function acceptFriendRequest(token: string, friendId: string | number) {
  try {
    return await apiFetch(`/friendships/friends/${friendId}/accept`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
  } catch (error) {
    console.error(`Failed to accept friend request to ${friendId}:`, error);
    throw error;
  }
}

export async function declineFriendRequest(token: string, friendId: string | number) {
  try {
    return await apiFetch(`/friendships/friends/${friendId}/decline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
  } catch (error) {
    console.error(`Failed to decline friend request to ${friendId}:`, error);
    throw error;
  }
}

export async function blockFriend(token: string, friendId: string | number) {
  try {
    return await apiFetch(`/friendships/friends/${friendId}/block`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
  } catch (error) {
    console.error(`Failed to block user with ${friendId}:`, error);
    throw error;
  }
}

export async function removeFriend(token: string, friendId: string | number) {
  try {
    return await apiFetch(`/friendships/friends/${friendId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
  } catch (error) {
    console.error(`Failed to remove friend with ${friendId}:`, error);
    throw error;
  }
}

export async function getUserFriends(token: string): Promise<Friend[]> {
  try {
    const friends = await apiFetch(`/users/friends`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return Array.isArray(friends) ? friends : [];
  } catch (error) {
    console.error(`Failed to fetch friends:`, error);
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
  token: string,
  userId: string | number, // kept for backward compatibility with url params
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
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(filteredUpdates),
  });

  return data;
};

export async function getMutualFriends(viewerToken: string, profileId: string | number): Promise<Friend[]> {
  try {
    // Fetch both lists in parallel for better performance
    const [viewerFriends, profileFriends] = await Promise.all([
      getUserFriends(viewerToken),
      getUserById(profileId).then(user => user.friends || []) // Fallback, would need dedicated generic get friends if needed. Let's just reuse.
    ]);

    // Create a Set of viewer friend IDs for O(1) lookup time
    const viewerFriendIds = new Set(viewerFriends.map(f => f.id));

    // Filter profile friends to only include those in the viewer's list
    const mutual = profileFriends.filter((f: Friend) => viewerFriendIds.has(f.id));

    return mutual;
  } catch (error) {
    console.error(`Failed to calculate mutual friends between ${viewerToken} and ${profileId}:`, error);
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

export const toggleGhostMode = async (token: string, currentUserId: number, isGhostModeNow: boolean) => {
  const allFriends = await getUserFriends(token);
  const nextVisibility = !isGhostModeNow;

  return Promise.all(
    allFriends.map((friend) =>
      apiFetch(`/userlocations/permissions/${friend.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ownerId: currentUserId,
          enabled: nextVisibility,
        }),
      })
    )
  );
}
