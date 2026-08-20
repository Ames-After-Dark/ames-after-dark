import { render } from '@testing-library/react-native';

import AccountIndex from '../index';
import { useAuth } from '@/hooks/use-auth';
import { Redirect } from 'expo-router';

jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('expo-router', () => ({
  Redirect: jest.fn(() => null),
}));

describe('AccountIndex routing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to the current account when a user exists', () => {
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: { id: '123' },
      isLoading: false,
    });

    render(<AccountIndex />);

    expect((Redirect as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({ href: '/account/123' })
    );
  });

  it('shows a guest sign-in prompt when no user exists', () => {
    (useAuth as jest.Mock).mockReturnValue({
      currentUser: null,
      isLoading: false,
      signIn: jest.fn(),
    });

    const { getByText } = render(<AccountIndex />);

    expect(getByText('Sign in for your account')).toBeTruthy();
    expect(Redirect).not.toHaveBeenCalled();
  });
});
