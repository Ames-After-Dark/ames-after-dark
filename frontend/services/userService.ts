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

