import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Pressable } from 'react-native';
import { router } from 'expo-router';

export default function FriendsScreen() {
  // useState to manage the search input
  const [searchQuery, setSearchQuery] = useState('');
  return (
      <ParallaxScrollView
          headerBackgroundColor={{ light: '#2A2A2A', dark: '#2A2A2A' }}
          headerImage={<IconSymbol size={220} name="person.2.fill" color="#808080" />}
       >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Friends</ThemedText>
                    <Pressable onPress={() => router.push('/friends/account')}>
                      <IconSymbol name="gearshape.fill" size={25} color="#ccc" style={{ marginLeft: 'auto' }} />
                    </Pressable>
      </ThemedView>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.searchContainer}>
          <IconSymbol name="search" size={18} color="#888" />
          <TextInput
            style={styles.searchBar}
            placeholder="Search..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </ThemedView>
        <ThemedText>no friends yet :(</ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%', //spans screen
    gap: 8,
    padding: 16,
  },
  container: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
    height: 40,
  },
  searchBar: {
    flex: 1,
    marginLeft: 8,
    color: '#fff', // makes text visible in dark mode
  },
});