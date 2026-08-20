import { render, screen } from '@testing-library/react-native';

import { ThemedText } from '../themed-text';
import { Theme } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

jest.mock('@/hooks/use-theme-color', () => ({
  useThemeColor: jest.fn(),
}));

describe('ThemedText', () => {
  beforeEach(() => {
    (useThemeColor as jest.Mock).mockReturnValue('#c0ffee');
  });

  it('applies the resolved theme color to default text', () => {
    render(<ThemedText>Hello world</ThemedText>);

    expect(screen.getByText('Hello world')).toHaveStyle({
      color: '#c0ffee',
      fontSize: 16,
      lineHeight: 24,
    });
  });

  it('uses the app primary color for link text', () => {
    render(<ThemedText type="link">Open details</ThemedText>);

    expect(screen.getByText('Open details')).toHaveStyle({
      color: Theme.dark.primary,
      fontSize: 16,
      lineHeight: 30,
    });
  });
});