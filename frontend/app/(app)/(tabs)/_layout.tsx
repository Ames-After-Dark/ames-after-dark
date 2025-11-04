import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Theme } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
// import { AuthProvider, useAuth } from "@/hooks/use-auth"

import TopHeader from "@/components/TopHeader"; // uses components/TopHeader.tsx

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={26} style={{ marginBottom: -2 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // const { isAuthenticated } = useAuth();


  return (
    <Tabs
      screenOptions={{
//         headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Theme.dark.primary,
        tabBarInactiveTintColor: Colors.dark.icon,
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          height: 64,
          borderRadius: 32,
          backgroundColor: Theme.dark.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 10,
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

    //                     tabBarActiveTintColor: tint,
//             tabBarInactiveTintColor: colorScheme === "dark" ? "#94a3b8" : "#6b7280",
//             tabBarStyle: {
//                 backgroundColor: "#0B0C12",
//                 borderTopColor: "#1F2937",
//             },
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
