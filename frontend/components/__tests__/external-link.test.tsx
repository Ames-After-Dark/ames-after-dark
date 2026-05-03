import { render } from '@testing-library/react-native';

import { ExternalLink } from '../external-link';
import { openBrowserAsync } from 'expo-web-browser';

const mockLink = jest.fn(({ onPress, children }: any) => {
  const { Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={onPress}>
      <Text>{children}</Text>
    </TouchableOpacity>
  );
});

jest.mock('expo-router', () => ({
  Link: (props: any) => mockLink(props),
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: { AUTOMATIC: 'automatic' },
}));

function setExpoOs(value: string) {
  Object.defineProperty(process.env, 'EXPO_OS', {
    value,
    configurable: true,
    writable: true,
  });
}

describe('ExternalLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens the in-app browser on native platforms', async () => {
    setExpoOs('ios');
    const preventDefault = jest.fn();

    render(<ExternalLink href="https://example.com">Example</ExternalLink>);

    const props = mockLink.mock.calls.at(-1)?.[0];
    await props.onPress({ preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(openBrowserAsync).toHaveBeenCalledWith('https://example.com', {
      presentationStyle: 'automatic',
    });
  });

  it('renders links with a blank target for external navigation', () => {
    setExpoOs('web');

    render(<ExternalLink href="https://example.com">Example</ExternalLink>);

    const props = mockLink.mock.calls.at(-1)?.[0];
    expect(props.target).toBe('_blank');
    expect(openBrowserAsync).not.toHaveBeenCalled();
  });
});