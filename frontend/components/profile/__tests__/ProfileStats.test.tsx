import { fireEvent, render, screen } from '@testing-library/react-native';

import { ProfileStats } from '../ProfileStats';

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: ({ name }: any) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

describe('ProfileStats', () => {
  it('shows locked mutuals when viewing a stranger', () => {
    const onPressFriends = jest.fn();
    const onPressMutuals = jest.fn();

    render(
      <ProfileStats
        friendCount={8}
        mutualCount={2}
        isMe={false}
        isFriend={false}
        onPressFriends={onPressFriends}
        onPressMutuals={onPressMutuals}
      />
    );

    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('friends')).toBeTruthy();
    expect(screen.getByText('lock')).toBeTruthy();
    expect(screen.getByText('mutual')).toBeTruthy();

    fireEvent.press(screen.getByText('friends'));
    fireEvent.press(screen.getByText('mutual'));

    expect(onPressFriends).not.toHaveBeenCalled();
    expect(onPressMutuals).not.toHaveBeenCalled();
  });

  it('shows pending stats and allows presses for the profile owner', () => {
    const onPressFriends = jest.fn();
    const onPressMutuals = jest.fn();

    render(
      <ProfileStats
        friendCount={12}
        mutualCount={4}
        isMe={true}
        isFriend={false}
        onPressFriends={onPressFriends}
        onPressMutuals={onPressMutuals}
      />
    );

    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('pending')).toBeTruthy();

    fireEvent.press(screen.getByText('friends'));
    fireEvent.press(screen.getByText('pending'));

    expect(onPressFriends).toHaveBeenCalled();
    expect(onPressMutuals).toHaveBeenCalled();
  });
});