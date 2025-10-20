import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function AccountScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#2A2A2A', dark: '#2A2A2A' }}
      headerImage={<IconSymbol size={220} name="person.crop.circle" color="#808080" />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Account</ThemedText>
      </ThemedView>
      <ThemedView style={styles.container}>
        <ThemedText>Account details will go here.</ThemedText>
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
