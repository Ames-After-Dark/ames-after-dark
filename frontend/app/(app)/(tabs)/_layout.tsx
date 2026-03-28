import { Tabs } from 'expo-router';
import React from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { Theme } from '@/constants/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useAuth } from '@/hooks/use-auth';
import { TopHeaderVisibilityProvider, useTopHeaderVisibility } from '@/context/top-header-visibility';

import TopHeader from "@/components/TopHeader";

const ICON_OFFSET_Y = -13;
const TAB_BAR_SIDE_MARGIN = 20;
const TAB_BAR_BOTTOM_OFFSET = -10;
const TAB_BAR_HEIGHT = 64;
const TAB_CONTENT_BOTTOM_PADDING = -20;
const TAB_BAR_DEBUG_LOGS = true;

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

const TAB_BAR_BACKGROUND_OPACITY = .95;

function withHexOpacity(hexColor: string, opacity: number) {
  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  const alphaHex = Math.round(clampedOpacity * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();

  return `${hexColor}${alphaHex}`;
}

export default function TabLayout() {

  return (
    <TopHeaderVisibilityProvider>
      <TabLayoutInner />
    </TopHeaderVisibilityProvider>
  );
}

function TabLayoutInner() {

  const { currentUser } = useAuth();
  const pathname = usePathname();
  const { topHeaderVisible, setTopHeaderVisible } = useTopHeaderVisibility();

  // get the logged in user's ID 
  const myId = currentUser?.id;

  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const tabBarBackgroundColor =
    TAB_BAR_BACKGROUND_OPACITY >= 1
      ? Theme.container.background
      : withHexOpacity(Theme.container.background, TAB_BAR_BACKGROUND_OPACITY);

  const tabBarBottom = insets.bottom + TAB_BAR_BOTTOM_OFFSET;
  const tabSceneBottomPadding = TAB_CONTENT_BOTTOM_PADDING;

  React.useEffect(() => {
    // When navigating between tabs/screens, restore the header by default.
    setTopHeaderVisible(true);
  }, [pathname, setTopHeaderVisible]);

  React.useEffect(() => {
    if (!__DEV__ || !TAB_BAR_DEBUG_LOGS) {
      return;
    }

    console.log('[TabBarDebug]', {
      screenWidth,
      tabBarSideMargin: TAB_BAR_SIDE_MARGIN,
      tabBarWidthApprox: screenWidth - TAB_BAR_SIDE_MARGIN * 2,
      tabBarBottom,
      tabBarBottomOffset: TAB_BAR_BOTTOM_OFFSET,
      safeAreaBottom: insets.bottom,
      tabBarHeight: TAB_BAR_HEIGHT,
      tabSceneBottomPadding,
      tabBarBackgroundOpacity: TAB_BAR_BACKGROUND_OPACITY,
      tabBarBackgroundColor,
    });
  }, [insets.bottom, screenWidth, tabBarBackgroundColor, tabBarBottom, tabSceneBottomPadding]);

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
          left: 0,
          right: 0,
          marginHorizontal: TAB_BAR_SIDE_MARGIN,
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

        // Global header stays mounted; TopHeader handles smooth hide/show animation.
        header: () => <TopHeader visible={topHeaderVisible} />,

        // Keep header mounted to avoid jumpy relayout when scrolling.
        headerShown: true,
      }}>

      {/* order: tonight, map, bars, gallery, account */}

      {/* TONIGHT */}
      <Tabs.Screen
        name="tonight"
        options={{
          title: "Tonight",
          tabBarIcon: ({ color }) => <TabBarIcon name="moon-o" color={color} />,
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

      {/* FRIENDS / ACCOUNT */}
      <Tabs.Screen
        name="account"
        options={{
          title: "Account",

          href: (myId ? `/account/${myId}` : '/account') as any,
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          tabBarIconStyle: {
            marginTop: 6,
          }
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            if (myId) {

              e.preventDefault();

              navigation.navigate('account', {
                screen: '[id]',
                params: { id: myId.toString() },
              });
            }
          },
        })}
      />
    </Tabs>
  );
}
