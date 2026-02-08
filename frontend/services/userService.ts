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
