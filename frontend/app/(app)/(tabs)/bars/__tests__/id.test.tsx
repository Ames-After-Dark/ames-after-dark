import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import BarProfile from '../[id]';
import { useBarDetail } from '@/hooks/useBarDetail';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchLocationById } from '@/services/locationService';
import { getLatestWeekAlbums, getResizedImageUri } from '@/services/galleryService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

jest.mock('@/hooks/useBarDetail', () => ({
  useBarDetail: jest.fn(),
}));

jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/services/locationService', () => ({
  fetchLocationById: jest.fn(),
}));

jest.mock('@/services/galleryService', () => ({
  getLatestWeekAlbums: jest.fn(),
  getResizedImageUri: jest.fn((uri: string) => `${uri}?size=800`),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}));

jest.mock('@/components/bars/bar-detail-components', () => ({
  BarHeader: ({ bar }: any) => {
    const { Text } = require('react-native');
    return <Text>{bar.name}</Text>;
  },
  DealEventSection: ({ title }: any) => {
    const { Text } = require('react-native');
    return <Text>{title}</Text>;
  },
  BottomCard: ({ title, onPress }: any) => {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  },
  BarMapModal: () => null,
  BarGalleryModal: () => null,
}));

jest.mock('@/components/ui/error-state', () => () => null);

jest.mock('@/components/ui/skeleton', () => ({
  Skeleton: () => null,
}));

jest.mock('@/utils/bar-assets', () => ({
  getBarAssets: jest.fn(() => ({
    cover: { uri: 'cover.png' },
    logo: { uri: 'logo.png' },
    map: { uri: 'map.png' },
    gallery: { uri: 'gallery.png' },
  })),
}));

describe('BarProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: '42' });
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
    });
    (useSafeAreaInsets as jest.Mock).mockReturnValue({ top: 0, bottom: 0, left: 0, right: 0 });
    (useBarDetail as jest.Mock).mockReturnValue({
      bar: {
        id: 42,
        name: "Cy's Roost",
        description: 'Campus bar',
        openingTime: '4:00 PM',
        closingTime: '2:00 AM',
        status: 'Open',
        dealsScheduled: [],
        eventsScheduled: [],
      },
      loading: false,
      refetch: jest.fn(),
    });
    (fetchLocationById as jest.Mock).mockResolvedValue({ latitude: 42, longitude: -93 });
    (getLatestWeekAlbums as jest.Mock).mockResolvedValue([]);
  });

  it('navigates to the bar menu screen', async () => {
    render(<BarProfile />);

    await waitFor(() => expect(screen.getByText("Cy's Roost")).toBeTruthy());

    fireEvent.press(screen.getByText('View Menu'));

    expect((useRouter as jest.Mock).mock.results[0].value.push).toHaveBeenCalledWith({
      pathname: '/bars/menu',
      params: { id: '42' },
    });
  });
});