import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProfileHeader } from '../ProfileHeader';
import { useAuth } from '@/hooks/use-auth';

jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/components/profile/ProfileStats', () => ({
  ProfileStats: () => {
    const { Text } = require('react-native');
    return <Text>Profile stats</Text>;
  },
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: ({ name }: any) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

jest.mock('@/services/userService', () => ({
  updateUser: jest.fn(),
}));

describe('ProfileHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({
      userStatus: { userId: 77 },
      getAccessToken: jest.fn().mockResolvedValue('token-123'),
    });
  });

  it('opens the edit prompt and calls onRequestEdit when confirmed', () => {
    const onRequestEdit = jest.fn();

    render(
      <ProfileHeader
        user={{ name: 'Amy', username: 'amy', profile_photo_id: 1 }}
        isMe={true}
        isEditing={false}
        showBio={false}
        onRequestEdit={onRequestEdit}
      />
    );

    fireEvent.press(screen.getByText('pencil'));

    expect(screen.getByText('Edit Profile')).toBeTruthy();

    fireEvent.press(screen.getByText('Yes, Edit'));

    expect(onRequestEdit).toHaveBeenCalled();
  });
});