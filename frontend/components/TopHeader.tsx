import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Theme } from "@/constants/theme";
import { useAuth } from '@/hooks/use-auth';
import { useNavigationHistory } from '@/context/NavigationHistoryContext';

const HEADER_CONTENT_HEIGHT = 44;
const HEADER_HEIGHT = 44;

type TopHeaderProps = {
  visible?: boolean;
};

export default function TopHeader({ visible = true }: TopHeaderProps) {
  const pathname = usePathname();
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const { canGoBack, goBack } = useNavigationHistory();
  const animatedVisibility = React.useRef(new Animated.Value(visible ? 1 : 0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isAccountPath = pathname.startsWith('/account');

  // Header visibility is fully controlled by the `visible` prop passed from the tab layout.
  // canGoBack / path-based hiding is handled per-slot below, not at the container level.
  const effectiveVisible = visible;

  React.useEffect(() => {
    Animated.timing(animatedVisibility, {
      toValue: effectiveVisible ? 1 : 0,
      duration: effectiveVisible ? 240 : 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedVisibility, effectiveVisible]);

  const expandedHeight = insets.top + HEADER_CONTENT_HEIGHT;

  const animatedHeight = animatedVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [0, expandedHeight],
  });

  const animatedOpacity = animatedVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const animatedTranslateY = animatedVisibility.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: effectiveVisible ? 0 : -(HEADER_HEIGHT + insets.top),
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [effectiveVisible, insets.top]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: HEADER_HEIGHT + insets.top,
          paddingTop: insets.top,
          transform: [{ translateY: slideAnim }]
        }
      ]}
      pointerEvents={effectiveVisible ? 'auto' : 'none'}
    >
      <View style={styles.content}>

        {/* Left slot — back button when there's history, otherwise spacer */}
        <View style={{ width: 24, alignItems: 'center' }}>
          {canGoBack && (
            <TouchableOpacity
              onPress={goBack}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <FontAwesome name="chevron-left" size={18} color={Theme.container.inactiveText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center — logo, tapping always goes to tonight */}
        <TouchableOpacity onPress={() => router.push('/tonight' as any)} activeOpacity={1}>
          <Image
            source={require("../assets/images/LogoTopBar.png")}
            style={{ width: 170, height: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Right slot — gear icon on account pages */}
        <View style={{ width: 24, alignItems: 'center' }}>
          {isAccountPath && (
            <TouchableOpacity onPress={() => router.push('/account/settings' as any)}>
              <FontAwesome name="gear" size={24} color={Theme.container.inactiveText} />
            </TouchableOpacity>
          )}
        </View>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11, 12, 18, 1)',
    borderBottomWidth: 1,
    borderBottomColor: Theme.container.mainBorder,
    zIndex: 1000,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  }
});
