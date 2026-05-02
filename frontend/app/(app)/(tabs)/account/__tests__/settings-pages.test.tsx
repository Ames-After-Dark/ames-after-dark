import { render, screen } from '@testing-library/react-native';

import NotificationsScreen from '../notifications';
import PrivacyScreen from '../privacy';

jest.mock('expo-router', () => ({
  Stack: {
    Screen: () => null,
  },
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: ({ name }: any) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

describe('account settings pages', () => {
  it('renders the notifications information screen', () => {
    render(<NotificationsScreen />);

    expect(screen.getByText('Stay in the Loop')).toBeTruthy();
    expect(screen.getByText(/Push Notifications Coming Soon/)).toBeTruthy();
  });

  it('renders the privacy information screen', () => {
    render(<PrivacyScreen />);

    expect(screen.getByText('Privacy Controls')).toBeTruthy();
    expect(screen.getByText(/Coming in the next update/)).toBeTruthy();
  });
});