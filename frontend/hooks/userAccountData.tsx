import React, { useState, useEffect, useCallback } from 'react';

import {
    getUserById,
    getUserProfileByAuth
} from '@/services/userService';
import { useAuth } from "@/hooks/use-auth";
import { normalizeUserData } from '@/utils/user-mapping';

export const useAccountData = (targetId: number, isOwnProfile: boolean) => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const { getAccessToken } = useAuth();

    const fetchUser = useCallback(async () => {
        try {
            setLoading(true);
            const token = await getAccessToken();
            const data = isOwnProfile
                ? await getUserProfileByAuth(token!)
                : await getUserById(targetId);

            setUser(normalizeUserData(data));
        } finally {
            setLoading(false);
        }
    }, [targetId, isOwnProfile]);

    useEffect(() => { fetchUser(); }, [fetchUser]);

    return { user, loading, refetch: fetchUser };
};