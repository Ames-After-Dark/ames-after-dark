import React, { useState } from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function NotificationsScreen() {
  const [friendsOut, setFriendsOut] = useState(true);
  const [friendsBirthday, setFriendsBirthday] = useState(true);
  const [newDeals, setNewDeals] = useState(true);
  const [allUpdates, setAllUpdates] = useState(true);

  const toggleAllUpdates = (value: boolean) => {
    setAllUpdates(value);
    setFriendsOut(value);
    setFriendsBirthday(value);
    setNewDeals(value);
  };

  // Any single toggle turns "All Updates" off automatically
  const handleSingleToggle = (setter: (v: boolean) => void, value: boolean) => {
    setter(value);
    if (!value) setAllUpdates(false);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Manage Notifications" }} />

      <View style={styles.section}>

        <View style={styles.row}>
          <Text style={styles.text}>Notify me when my friends are out</Text>
          <Switch
            value={friendsOut}
            onValueChange={(v) => handleSingleToggle(setFriendsOut, v)}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.text}>Notify me when it's a friend’s birthday</Text>
          <Switch
            value={friendsBirthday}
            onValueChange={(v) => handleSingleToggle(setFriendsBirthday, v)}
          />
        </View>

        <View style={styles.row}>
          <Text style={styles.text}>Notify me when there are new deals</Text>
          <Switch
            value={newDeals}
            onValueChange={(v) => handleSingleToggle(setNewDeals, v)}
          />
        </View>

        <View style={[styles.row, styles.topBorder]}>
          <Text style={[styles.text, { fontWeight: "600" }]}>
            Notify me with all updates
          </Text>
          <Switch
            value={allUpdates}
            onValueChange={toggleAllUpdates}
          />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12", padding: 16 },
  section: {
    marginTop: 20,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1f2937",
    padding: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#1f2937",
    paddingVertical: 16,
  },
  text: {
    color: "#E5E5EE",
    fontSize: 16,
    flex: 1,
    paddingRight: 8,
  },
  topBorder: { borderTopWidth: 2 },
});
