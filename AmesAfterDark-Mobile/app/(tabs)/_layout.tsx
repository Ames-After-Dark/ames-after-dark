import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

import TopHeader from "@/components/TopHeader"; // uses components/TopHeader.tsx

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={26} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const tint = Colors[colorScheme ?? "light"].tint;

  return (
    <Tabs
      screenOptions={{
        // 🔹 Global header on every tab
        header: () => <TopHeader />,
        // If you wanted to hide header on web only, you can swap this back:
        // headerShown: useClientOnlyValue(false, true),
        headerShown: true,

        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: colorScheme === "dark" ? "#94a3b8" : "#6b7280",
        tabBarStyle: {
          backgroundColor: "#0B0C12",
          borderTopColor: "#1F2937",
        },
      }}
    >
      {/* FRIENDS */}
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color }) => <TabBarIcon name="users" color={color} />,
        }}
      />

      {/* MAP */}
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
        }}
      />

      {/* TONIGHT (index.tsx) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Tonight",
          tabBarIcon: ({ color }) => <TabBarIcon name="moon-o" color={color} />,
        }}
      />

      {/* BARS */}
      <Tabs.Screen
        name="bars"
        options={{
          title: "Bars",
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="glass-martini-alt" size={24} color={color} />
          ),
        }}
      />

      {/* GALLERY */}
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Gallery",
          tabBarIcon: ({ color }) => <TabBarIcon name="camera" color={color} />,
        }}
      />

      {/* Hide template Tab Two */}
      <Tabs.Screen name="two" options={{ href: null }} />
    </Tabs>
  );
}
