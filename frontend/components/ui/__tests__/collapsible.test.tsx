import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Collapsible } from '../collapsible';

jest.mock('@/components/themed-text', () => ({
  ThemedText: ({ children }: any) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));

jest.mock('@/components/themed-view', () => ({
  ThemedView: ({ children }: any) => {
    const { View } = require('react-native');
    return <View>{children}</View>;
  },
}));

jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: ({ name }: any) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

jest.mock('@/hooks/use-color-scheme', () => ({
  useColorScheme: jest.fn(() => 'light'),
}));

jest.mock('@/constants/theme', () => ({
  Colors: {
    light: { icon: '#111111' },
    dark: { icon: '#eeeeee' },
  },
}));

describe('Collapsible', () => {
  it('shows and hides children when the header is pressed', () => {
    render(
      <Collapsible title="More details">
        <Text>Hidden content</Text>
      </Collapsible>
    );

    expect(screen.queryByText('Hidden content')).toBeNull();

    fireEvent.press(screen.getByText('More details'));

    expect(screen.getByText('Hidden content')).toBeTruthy();
  });
});