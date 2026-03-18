/**
 * Helper to ensure the UI always sees consistent property names 
 * regardless of what the backend returns.
 */
export const normalizeUserData = (data: any) => {
    if (!data) return null;
    return {
        ...data,
        id: data.id || data.user_id,
        name: data.name || data.full_name || 'Anonymous',
        username: data.username || 'unknown',
        avatar: data.avatar || data.profile_pic_url,
        bio: data.bio || '',
        streak: data.streak || 0,
    };
};