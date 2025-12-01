import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Theme } from '@/constants/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
// import { AuthProvider, useAuth } from "@/hooks/use-auth"

import TopHeader from "@/components/TopHeader";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={26} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {

  // How to add opacity:
  // 100% opacity: #0f172a (Theme.container.background)
  // ~90% opacity: #0f172aE6
  // ~80% opacity: #0f172aCC
  // ~70% opacity: #0f172aB3
  // ~50% opacity: #0f172a80

  return (
    <Tabs
      initialRouteName="tonight"  
      screenOptions={{
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Theme.dark.primary,
        tabBarInactiveTintColor: Theme.dark.muted,

        // ⬇️ Normal, non-floating, non-transparent bottom tab bar
        tabBarStyle: {
          height: 64,
          backgroundColor: Theme.container.background, // solid, no transparency
          borderTopColor: Theme.container.mainBorder,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          marginTop: 8,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },

        // 🔹 Global header on every tab
        header: () => <TopHeader />,
        // If you wanted to hide header on web only, you can swap this back:
        // headerShown: useClientOnlyValue(false, true),
        headerShown: true,
      }}>
      {/* FRIENDS */}
        <Tabs.Screen
            name="account"
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
        name="tonight"
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
          )
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
    </Tabs>
  );
}
