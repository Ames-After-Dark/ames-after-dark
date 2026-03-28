import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Animated, Easing } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router'; // Add usePathname
import { Theme } from "@/constants/theme";

const HEADER_CONTENT_HEIGHT = 44;
const HEADER_HEIGHT = 44; // Adjust to your actual header height

type TopHeaderProps = {
  visible?: boolean;
};

export default function TopHeader({ visible = true }: TopHeaderProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const animatedVisibility = React.useRef(new Animated.Value(visible ? 1 : 0)).current;

  const slideAnim = useRef(new Animated.Value(0)).current;

  // 1. Check if we are on ANY account-related page
  const isAccountPath = pathname.startsWith('/account');

  // 2. Logic: If we are on a sub-page (like a friend's ID), show Back. 
  // If we are on our own ID (isMe check) or the root, show Gear.
  // For now, let's just make the Gear show up on any /account page:

  React.useEffect(() => {
    Animated.timing(animatedVisibility, {
      toValue: visible ? 1 : 0,
      duration: visible ? 240 : 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedVisibility, visible]);

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
      // Slide up by the height of the header + status bar height
      toValue: visible ? 0 : -(HEADER_HEIGHT + insets.top),
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, insets.top]);

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
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.content}>

        <View style={{ width: 24 }} />

        <TouchableOpacity onPress={() => router.push('/tonight' as any)} activeOpacity={0.85}>
          <Image
            source={require("../assets/images/LogoTopBar.png")}
            style={{ width: 170, height: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

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
    backgroundColor: 'rgba(11, 12, 18, 0.85)',
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