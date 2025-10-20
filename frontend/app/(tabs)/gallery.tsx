import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function GalleryScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#2A2A2A', dark: '#2A2A2A' }}
      headerImage={<IconSymbol size={220} name="photo.fill" color="#808080" />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Gallery</ThemedText>
      </ThemedView>
      <ThemedView style={styles.container}>
        <ThemedText>Gallery content will go here.</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  container: {
    padding: 8,
  },
});
