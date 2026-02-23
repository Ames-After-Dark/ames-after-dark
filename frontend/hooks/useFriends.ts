import { useEffect, useState } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { getUserFriends } from '@/services/userService';
import { Friend } from '@/types/types';

export function useFriends(userId: string | number | null) {
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
      const data = await getUserFriends(userId);
      setFriends(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch friends'));
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return { friends, loading, error, refetch: fetchFriends };
}
