import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { getCurrentUser } from '@/services/userService';


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
            if (token) {
                const userData = await getCurrentUser(token);
                setUser(userData);
            }
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