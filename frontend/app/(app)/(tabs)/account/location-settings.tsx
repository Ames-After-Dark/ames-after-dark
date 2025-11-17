import {
  View,
  Text,
  TextInput,
  Switch,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Stack } from "expo-router";
import React, { useState } from "react";

export default function LocationVisibilityScreen() {
  const [shareWithAll, setShareWithAll] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Mock friends list (replace with real data later)
  const friends = [
    { id: "1", name: "Alex Johnson" },
    { id: "2", name: "Taylor Smith" },
    { id: "3", name: "Jordan Lee" },
    { id: "4", name: "Chris Roberts" },
  ];

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleFriendSelection = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id)
        ? prev.filter((fid) => fid !== id)
        : [...prev, id]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Location Visibility" }} />

      <Text style={styles.title}>Control who can see your location!</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Let all friends view location</Text>
        <Switch
          value={shareWithAll}
          onValueChange={setShareWithAll}
        />
      </View>

      {/* Show this only if toggled OFF */}
      {!shareWithAll && (
        <>
          <Text style={styles.subLabel}>Select which friends can see:</Text>
          <TextInput
            style={styles.input}
            placeholder="Search friends"
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />

          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const selected = selectedFriends.includes(item.id);
              return (
                <TouchableOpacity
                  style={[styles.friendItem, selected && styles.selectedFriend]}
                  onPress={() => toggleFriendSelection(item.id)}
                >
                  <Text style={styles.friendName}>{item.name}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12", padding: 16 },
  title: { color: "white", fontSize: 16, marginBottom: 20 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1f2937",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  label: { color: "white", fontSize: 15 },
  subLabel: { color: "#ccc", marginBottom: 6 },
  input: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 12,
    color: "white",
    marginBottom: 12,
  },
  friendItem: {
    padding: 12,
    backgroundColor: "#1f2937",
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFriend: {
    backgroundColor: "#2563eb", // highlight selected
  },
  friendName: { color: "white" },
});
