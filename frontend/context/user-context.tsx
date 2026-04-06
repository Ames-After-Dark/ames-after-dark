import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { getUserById, getUserProfileByAuth } from '@/services/userService';

interface UserContextType {
    user: any | null;
    isLoading: boolean;
    refetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { userStatus, getAccessToken } = useAuth();
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = async () => {
        if (!userStatus?.userId) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            const token = await getAccessToken();
            let userData: any = null;

            if (token) {
                userData = await getUserProfileByAuth(token);
            }

            // Account screens use /users/:id and include profile_photo_id.
            // Enrich context with that same payload when auth profile is missing fields.
            if (!userData || userData.profile_photo_id == null) {
                const fullUser = await getUserById(userStatus.userId);
                userData = {
                    ...(fullUser || {}),
                    ...(userData || {}),
                    profile_photo_id: fullUser?.profile_photo_id ?? userData?.profile_photo_id ?? null,
                };
            }

            setUser(userData);
        } catch (err) {
            console.error('Failed to fetch user context:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [userStatus?.userId]);

    return (
        <UserContext.Provider value={{ user, isLoading, refetchUser: fetchUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
};