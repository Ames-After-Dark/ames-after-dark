import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function MapScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#153940', dark: '#153940' }}
      headerImage={<IconSymbol size={220} name="map.fill" color="#808080" />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Map</ThemedText>
      </ThemedView>
      <ThemedView style={styles.container}>
        <ThemedText>Map view will go here.</ThemedText>
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
