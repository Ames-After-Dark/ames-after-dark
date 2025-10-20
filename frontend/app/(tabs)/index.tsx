import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function BarsScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#2A2A2A', dark: '#2A2A2A' }}
      headerImage={<IconSymbol size={220} name="list.bullet" color="#808080" />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Bars</ThemedText>
      </ThemedView>
      <ThemedView style={styles.container}>
        <ThemedText>List of bars will go here.</ThemedText>
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
