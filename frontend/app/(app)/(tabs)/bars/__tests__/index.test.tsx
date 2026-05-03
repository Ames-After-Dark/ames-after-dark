import { fireEvent, render, screen } from '@testing-library/react-native';
import { Animated } from 'react-native';

import Bars from '../index';
import { useBars } from '@/hooks/useBars';
import { useRouter, useNavigation } from 'expo-router';
import { useFavorites } from '@/context/FavoritesContext';
import { useTopHeaderVisibility } from '@/context/top-header-visibility';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shouldForceErrorPage } from '@/utils/dev-error-pages';
import { useFocusEffect } from '@react-navigation/native';

jest.mock('@/hooks/useBars', () => ({
  useBars: jest.fn(),
}));

jest.mock('expo-router', () => ({
  routerMock: {
    replace: jest.fn(),
  },
  useNavigation: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/context/FavoritesContext', () => ({
  useFavorites: jest.fn(),
}));

jest.mock('@/context/top-header-visibility', () => ({
  useTopHeaderVisibility: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}));

jest.mock('@/utils/dev-error-pages', () => ({
  shouldForceErrorPage: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => {
  const { Text } = require('react-native');

  return {
    FontAwesome: ({ name }: any) => <Text>{name}</Text>,
    FontAwesome5: ({ name }: any) => <Text>{name}</Text>,
  };
});

jest.mock('@/components/bars/bar-list-components', () => ({
  BarCard: ({ item, onPress }: any) => {
    const { Text, TouchableOpacity } = require('react-native');

    return (
      <TouchableOpacity onPress={() => onPress(String(item.id))}>
        <Text>{item.name}</Text>
      </TouchableOpacity>
    );
  },
  FilterTab: ({ label, onPress }: any) => {
    const { Text, TouchableOpacity } = require('react-native');

    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{label}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => null,
}));

jest.mock('@/components/ui/error-state', () => () => null);

describe('Bars route interaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
    } as any);

    const replace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace });

    (useBars as jest.Mock).mockReturnValue({
      bars: [
        {
          id: 'bar-1',
          name: 'Open Bar',
          description: 'Best place downtown',
          location_type_id: 1,
          __openNow: true,
        },
      ],
      loading: false,
      error: null,
      refetch: jest.fn(),
    });

    (useNavigation as jest.Mock).mockReturnValue({
      getParent: jest.fn(() => undefined),
      isFocused: jest.fn(() => true),
    });

    (useFavorites as jest.Mock).mockReturnValue({
      isFavorited: jest.fn(() => false),
      toggleFavorite: jest.fn(),
    });

    const setTopHeaderVisible = jest.fn();
    (useTopHeaderVisibility as jest.Mock).mockReturnValue({
      topHeaderVisible: true,
      setTopHeaderVisible,
    });

    (useSafeAreaInsets as jest.Mock).mockReturnValue({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });

    (shouldForceErrorPage as jest.Mock).mockReturnValue(false);
    (useFocusEffect as jest.Mock).mockImplementation((callback: any) => callback?.());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('navigates to the bar detail screen when a card is pressed', () => {
    render(<Bars />);

    fireEvent.press(screen.getByText('Open Bar'));

    expect((useRouter as jest.Mock).mock.results[0].value.replace).toHaveBeenCalledWith({
      pathname: '/(app)/(tabs)/bars/[id]',
      params: { id: 'bar-1' },
    });
  });
});