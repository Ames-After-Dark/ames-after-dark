import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Theme } from "@/constants/theme";
import { useNavigationHistory } from '@/context/NavigationHistoryContext';
import { useLocalSearchParams } from 'expo-router';
import { useFavorites } from '@/context/FavoritesContext';

const HEADER_HEIGHT = 44;

type TopHeaderProps = {
  visible?: boolean;
};

export default function TopHeader({ visible = true }: TopHeaderProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { canGoBack, goBack } = useNavigationHistory();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const params = useLocalSearchParams();
  let id = params.id as string;

  if (!id && pathname.startsWith('/bars/')) {
    const parts = pathname.split('/');
    id = parts[2];
  }
  const { isFavorited, toggleFavorite } = useFavorites();

  // console.log('TopHeader - Pathname:', pathname);
  // console.log('TopHeader - Bar ID param:', id);

  const isAccountPath = pathname.startsWith('/account');
  const isGalleryPath = pathname.startsWith('/gallery');
  const isBarProfile = pathname.includes('/bars/') && id;

  const barIdNumeric = id ? Number(id) : NaN;
  const hasValidId = !isNaN(barIdNumeric);

  useEffect(() => {
    Animated.timing(slideAnim, {
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

        {/* Left slot - back arrow */}
        <View style={styles.slot}>
          {canGoBack && !isGalleryPath && (
            <TouchableOpacity onPress={goBack} hitSlop={12}>
              <FontAwesome name="chevron-left" size={18} color={Theme.container.inactiveText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center - logo */}
        <TouchableOpacity onPress={() => router.push('/tonight' as any)} activeOpacity={1}>
          <Image
            source={require("../assets/images/LogoTopBar.png")}
            style={{ width: 170, height: 32 }}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Right slot - Conditional Rendering using Ternaries 
                          account - gear for settings 
                          individual bar profile - favorite button */}
        <View style={styles.slot}>
          {isBarProfile && hasValidId ? (
            <TouchableOpacity
              onPress={() => toggleFavorite(barIdNumeric)}
              hitSlop={10}
            >
              <FontAwesome
                name={isFavorited(barIdNumeric) ? "star" : "star-o"}
                size={22}
                color={isFavorited(barIdNumeric) ? Theme.dark.tertiary : Theme.container.inactiveText}
              />
            </TouchableOpacity>
          ) : isAccountPath ? (
            <TouchableOpacity onPress={() => router.push('/account/settings' as any)}>
              <FontAwesome name="gear" size={24} color={Theme.container.inactiveText} />
            </TouchableOpacity>
          ) : null}
        </View>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
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
  slot: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  }
});