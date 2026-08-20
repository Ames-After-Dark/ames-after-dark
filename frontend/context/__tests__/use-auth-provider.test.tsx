import { render, screen, waitFor } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { useAuth0 } from 'react-native-auth0';
import { checkUserStatus, getUsernameByAuth } from '@/services/userService';

jest.mock('react-native-auth0', () => ({
  useAuth0: jest.fn(),
}));

jest.mock('@/services/userService', () => ({
  checkUserStatus: jest.fn(),
  getUsernameByAuth: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn(), push: jest.fn() })),
  useSegments: jest.fn(() => []),
  useRootNavigationState: jest.fn(() => ({ key: 'root' })),
}));

function AuthProbe() {
  const { isAuthenticated, isLoading, currentUser, username } = useAuth();

  return (
    <View>
      <Text testID="auth-status">{isAuthenticated ? 'authenticated' : 'anonymous'}</Text>
      <Text testID="loading-status">{isLoading ? 'loading' : 'ready'}</Text>
      <Text testID="current-user">{String(currentUser?.id ?? 'none')}</Text>
      <Text testID="username">{username ?? 'none'}</Text>
    </View>
  );
}

describe('AuthProvider state hydration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth0 as jest.Mock).mockReturnValue({
      authorize: jest.fn(),
      clearSession: jest.fn(),
      clearCredentials: jest.fn(),
      user: { email: 'amy@example.com', name: 'Amy' },
      error: null,
      getCredentials: jest.fn().mockResolvedValue({ accessToken: 'token-123' }),
    });

    (checkUserStatus as jest.Mock).mockResolvedValue({
      registered: true,
      profileComplete: true,
      requiresRegistration: false,
      user: { id: 77, name: 'Amy', username: 'amy' },
    });

    (getUsernameByAuth as jest.Mock).mockResolvedValue({
      hasUsername: true,
      username: 'amy',
    });
  });

  it('hydrates auth state from the Auth0 session', async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading-status')).toHaveTextContent('ready'));
    await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated'));
    await waitFor(() => expect(screen.getByTestId('current-user')).toHaveTextContent('77'));
    await waitFor(() => expect(screen.getByTestId('username')).toHaveTextContent('amy'));

    expect(checkUserStatus).toHaveBeenCalledWith('token-123');
    expect(getUsernameByAuth).toHaveBeenCalledWith('token-123');
  });
});