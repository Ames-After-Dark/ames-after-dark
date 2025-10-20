import { useState } from 'react';

export function useAuthenticationCheck() {
    const[isAuthenticated, setIsAuthenticated] = useState(false);

    //check if user is authenticated potentially through async persistent storage on device

    return isAuthenticated;
}
