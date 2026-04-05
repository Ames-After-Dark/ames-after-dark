import { useCallback, useEffect, useState } from 'react';
import { getUserFriends } from '@/services/userService';
import { Friend } from '@/types/types';
import { useAuth } from './use-auth';

export function useFriends(userId: string | number | null) {
  const { getAccessToken } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFriends = useCallback(async () => {
    if (!userId) {
      setFriends([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const data = await getUserFriends(token);
      setFriends(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch friends'));
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [userId, getAccessToken]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return { friends, loading, error, refetch: fetchFriends };
}
