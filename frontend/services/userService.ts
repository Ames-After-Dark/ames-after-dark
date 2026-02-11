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
