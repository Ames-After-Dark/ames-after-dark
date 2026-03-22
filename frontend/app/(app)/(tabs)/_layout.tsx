import { Tabs } from 'expo-router';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Theme } from '@/constants/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
// import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { useAuth } from '@/hooks/use-auth';

import TopHeader from "@/components/TopHeader";

const ICON_OFFSET_Y = -13;
const TAB_BAR_HORIZONTAL_MARGIN = 5;
const TAB_BAR_BOTTOM_GAP = 25;
const TAB_BAR_HEIGHT = 64;
const TAB_CONTENT_BOTTOM_PADDING = 12;

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={26} style={{ marginBottom: ICON_OFFSET_Y }} {...props} />;
}

function TabBarIcon5(props: {
  name: React.ComponentProps<typeof FontAwesome5>["name"];
  color: string;
}) {
  return <FontAwesome5 size={26} style={{ marginBottom: ICON_OFFSET_Y }} {...props} />;
}

const TAB_BAR_BACKGROUND_OPACITY = 0.95;

function withHexOpacity(hexColor: string, opacity: number) {
  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  const alphaHex = Math.round(clampedOpacity * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  return `${hexColor}${alphaHex}`;
}

export default function TabLayout() {

  const { currentUser } = useAuth();

  // get the logged in user's ID 
  const myId = currentUser?.id;

  const insets = useSafeAreaInsets();

  const tabBarBackgroundColor =
    TAB_BAR_BACKGROUND_OPACITY >= 1
      ? Theme.container.background
      : withHexOpacity(Theme.container.background, TAB_BAR_BACKGROUND_OPACITY);

  const tabBarBottom = Math.max(insets.bottom, TAB_BAR_BOTTOM_GAP);
  const tabSceneBottomPadding = TAB_BAR_HEIGHT + tabBarBottom + TAB_CONTENT_BOTTOM_PADDING;

  return (
    <Tabs
      initialRouteName="tonight"
      screenOptions={{

        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarActiveTintColor: Theme.dark.primary,
        tabBarInactiveTintColor: Theme.dark.muted,
        sceneStyle: {
          backgroundColor: Theme.dark.background,
          paddingBottom: tabSceneBottomPadding,
        },

        tabBarStyle: {
          position: 'absolute',
          marginLeft: TAB_BAR_HORIZONTAL_MARGIN,
          marginRight: TAB_BAR_HORIZONTAL_MARGIN,
          bottom: tabBarBottom,
          height: TAB_BAR_HEIGHT,
          borderRadius: 999,
          backgroundColor: tabBarBackgroundColor,
          borderColor: Theme.container.mainBorder,
          borderWidth: 1,
          shadowColor: Theme.dark.black,
          shadowOpacity: 0.2,
          shadowRadius: 14,
          shadowOffset: {
            width: 0,
            height: 8
          },
          elevation: 12,
        },
        tabBarItemStyle: {
          marginTop: 6,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },

        // 🔹 Global header on every tab
        header: () => <TopHeader />,

        // header: (props) => {
        //   // Get the ID from the current route params
        //   const routeId = props.route.params?.id;
        //   // Check if the route we are on matches the logged-in user
        //   const isMe = myId && routeId && Number(routeId) === myId;

        //   return <TopHeader isMe={isMe} />;
        // },

        // If you wanted to hide header on web only, you can swap this back:
        // headerShown: useClientOnlyValue(false, true),
        headerShown: true,
      }}>
      {/* FRIENDS */}
      {/* <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          href: (myId ? `/account/${myId}` : '/account') as any,
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
        }}
      /> */}
      {/* FRIENDS / ACCOUNT */}
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",
          // The dynamic href tells Expo where the tab "starts"
          href: (myId ? `/account/${myId}` : '/account') as any,
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          tabBarIconStyle: {
            marginTop: 6, // Fine-tune just this one icon
          }
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (myId) {
              // 1. Prevent the default behavior (which might just stay on the current screen)
              e.preventDefault();

              // 2. Force navigate to your specific ID
              // This ensures if you're on a friend's page, you "jump" back to yours
              navigation.navigate('account', {
                screen: '[id]',
                params: { id: myId.toString() },
              });
            }
          },
        })}
      />

      {/* MAP */}
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
        }}
      />

      {/* TONIGHT */}
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
            <TabBarIcon5 name="glass-martini-alt" color={color} />
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
