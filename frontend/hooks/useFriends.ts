import { useCallback, useEffect, useState } from 'react';
import { getUserFriends } from '@/services/userService';
import { Friend } from '@/types/types';
import { useAuth } from './use-auth';

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { getAccessToken } = useAuth();

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        setFriends([]);
        setLoading(false);
        return;
      }
      const data = await getUserFriends(token);
      setFriends(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch friends'));
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return { friends, loading, error, refetch: fetchFriends };
}
