import { render, screen } from '@testing-library/react-native';

import GalleryFallback from '@/app/(app)/(tabs)/gallery/Galleryfallback';

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: ({ name }: any) => {
    const { Text } = require('react-native');
    return <Text>{name}</Text>;
  },
}));

describe('GalleryFallback', () => {
  it('renders the empty gallery message and placeholder cards', () => {
    render(<GalleryFallback />);

    expect(screen.getByText('No photos have been uploaded for this week yet. Check back soon!')).toBeTruthy();
    expect(screen.getAllByText('image')).toHaveLength(8);
  });
});