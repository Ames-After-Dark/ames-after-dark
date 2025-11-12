import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native'; // <-- Import Platform

import { HapticTab } from '@/components/haptic-tab';
// import { IconSymbol } from '@/components/ui/icon-symbol'; // This import was unused, removing
// Import the Theme object, Colors is no longer needed here
import { Theme } from '@/constants/theme';
// useColorScheme is no longer needed if we're consistently using Theme.dark
// import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
// import { AuthProvider, useAuth } from "@/hooks/use-auth"

import TopHeader from "@/components/TopHeader"; // uses components/TopHeader.tsx
// export { useColorScheme } from 'react-native';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={26} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  // const colorScheme = useColorScheme(); // No longer needed
  // const { isAuthenticated } = useAuth();
  // const tint = Colors[colorScheme ?? "light"].tint; // We will use Theme.dark.primary instead

  // How to add opacity:
  // 100% opacity: #0f172a (Theme.container.background)
  // ~90% opacity: #0f172aE6
  // ~80% opacity: #0f172aCC
  // ~70% opacity: #0f172aB3
  // ~50% opacity: #0f172a80
  const transparentSurfaceColor = Theme.container.background + 'e6';

  return (
    <Tabs
      screenOptions={{
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Theme.dark.primary,
        tabBarInactiveTintColor: Theme.dark.muted,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: '10%',
          right: '10%',
          height: 64,
          borderRadius: 32,
          backgroundColor: transparentSurfaceColor,

          // --- Shadow Update (Re-applied) ---
          // Use Platform.select to apply the correct shadow style for each platform
          // This fixes the web deprecation warning by using 'boxShadow'
          ...Platform.select({
            ios: {
              shadowColor: Theme.dark.black,
              shadowOffset: {
                width: 0,
                height: 6
              },
              shadowOpacity: 0.3,
              shadowRadius: 12,
            },
            android: {
              elevation: 10,
            },
            web: {
              boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.3)',
            }
          }),
          // Add a border to make it pop from the background,
          // especially since it's semi-transparent now.
          borderColor: Theme.container.mainBorder,
          borderWidth: 1,
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
            name="friends/friends"
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
      <Tabs.Screen
        name="friends/account"
        options={{
          href: null, // hidden from tab bar, opened through settings gear
          title: 'Account',
        }}
      />
    </Tabs>
  );
}
