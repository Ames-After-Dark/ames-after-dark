import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { Stack } from "expo-router";
import { FontAwesome } from '@expo/vector-icons';

import { Friend } from '@/types/types';
import { getUserFriends } from '@/services/userService';

export default function LocationVisibilityScreen() {
  const [shareWithAll, setShareWithAll] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch real friends data
  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      setError(null);
      try {
        const currentUserId = 'YOUR_USER_ID'; // get this from auth context/state
        const friendsData = await getUserFriends(currentUserId);
        setFriends(friendsData || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch friends'));
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  const filteredFriends = friends.filter((f) =>
    (f.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleFriendSelection = (id: string) => {
    setSelectedFriends((prev) =>
      prev.includes(id)
        ? prev.filter((fid) => fid !== id)
        : [...prev, id]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Stack.Screen
          options={{
            title: 'Location Visibility',
            headerBackTitle: 'Settings',
            headerStyle: {
              backgroundColor: '#0b0b12',
            },
            headerTintColor: 'white',
          }}
        />
        <ActivityIndicator size="large" color="#33CCFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Stack.Screen
          options={{
            title: 'Location Visibility',
            headerBackTitle: 'Settings',
            headerStyle: {
              backgroundColor: '#0b0b12',
            },
            headerTintColor: 'white',
          }}
        />
        <Text style={styles.errorText}>Failed to load friends</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Location Visibility',
          headerBackTitle: 'Settings',
          headerStyle: {
            backgroundColor: '#0b0b12',
          },
          headerTintColor: 'white',
        }}
      />

      <Text style={styles.title}>Control who can see your location!</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Let all friends view location</Text>
        <Switch
          value={shareWithAll}
          onValueChange={setShareWithAll}
          trackColor={{ false: '#1f2937', true: '#33CCFF' }}
          thumbColor={shareWithAll ? '#ffffff' : '#f4f3f4'}
        />
      </View>

      {/* Show this only if toggled OFF */}
      {!shareWithAll && (
        <>
          <Text style={styles.subLabel}>
            Select which friends can see ({selectedFriends.length} selected)
          </Text>

          <View style={styles.searchContainer}>
            <FontAwesome name="search" size={18} color="#888" />
            <TextInput
              style={styles.input}
              placeholder="Search friends"
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
            />
          </View>

          {filteredFriends.length > 0 ? (
            <FlatList
              data={filteredFriends}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = selectedFriends.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.friendItem, selected && styles.selectedFriend]}
                    onPress={() => toggleFriendSelection(item.id)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={item.avatar || require('../../../../assets/images/Logo.png')}
                      style={styles.friendAvatar}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.friendName}>{item.name || 'Unknown'}</Text>
                      <Text style={styles.friendStatus}>
                        {item.status || 'Offline'}
                      </Text>
                    </View>
                    {selected && (
                      <FontAwesome name="check-circle" size={24} color="#33CCFF" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {search ? 'No friends found' : 'No friends yet'}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b12",
    padding: 16
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: "white",
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#0f172a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  label: {
    color: "white",
    fontSize: 15,
    fontWeight: '500',
  },
  subLabel: {
    color: "#ccc",
    marginBottom: 10,
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  input: {
    flex: 1,
    marginLeft: 8,
    color: "white",
  },
  friendItem: {
    padding: 12,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  selectedFriend: {
    backgroundColor: "#1e3a5f",
    borderColor: "#33CCFF",
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  friendName: {
    color: "white",
    fontSize: 16,
    fontWeight: '600',
  },
  friendStatus: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
  },
});