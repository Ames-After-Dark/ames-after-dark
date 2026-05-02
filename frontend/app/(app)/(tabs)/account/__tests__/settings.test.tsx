import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import AccountSettingsScreen from '../settings';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';
import { getUserById } from '@/services/userService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAvatarById } from '@/utils/profileAssets';

jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
}));

jest.mock('@/services/userService', () => ({
  getUserById: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}));

jest.mock('@/utils/profileAssets', () => ({
  getAvatarById: jest.fn(),
}));

describe('AccountSettingsScreen navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      signOut: jest.fn(),
      user: { email: 'user@example.com' },
      username: 'amy',
      userStatus: { userId: 42, user: { name: 'Amy' } },
      getAccessToken: jest.fn().mockResolvedValue('token-123'),
    });

    (useSafeAreaInsets as jest.Mock).mockReturnValue({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });

    (getAvatarById as jest.Mock).mockReturnValue({ source: { uri: 'avatar.png' } });
    (getUserById as jest.Mock).mockResolvedValue({
      id: 42,
      name: 'Amy',
      username: 'amy',
      email: 'user@example.com',
      profile_photo_id: 1,
    });
  });

  it('navigates to privacy settings when the row is pressed', async () => {
    render(<AccountSettingsScreen />);

    await waitFor(() => expect(getUserById).toHaveBeenCalledWith('token-123', '42'));

    fireEvent.press(screen.getByText('Privacy Settings'));

    expect(router.push).toHaveBeenCalledWith('/account/privacy');
  });
});