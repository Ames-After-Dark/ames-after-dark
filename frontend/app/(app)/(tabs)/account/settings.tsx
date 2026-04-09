import React, { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/theme';
import { getAvatarById } from '@/utils/profileAssets';
import { getUserById } from '@/services/userService';

// Must match the TopHeader height used in the tabs layout
const HEADER_HEIGHT = 60;

interface SettingsItemProps {
  icon: any;
  text: string;
  onPress: () => void;
  color?: string;
  showArrow?: boolean;
}

const SettingsItem = ({ icon, text, onPress, color = Theme.dark.white, showArrow = true }: SettingsItemProps) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <FontAwesome name={icon} size={20} color={color} style={styles.icon} />
    <Text style={[styles.settingText, { color }]}>{text}</Text>
    {showArrow && <FontAwesome name="chevron-right" size={16} color={Theme.container.inactiveText} />}
  </TouchableOpacity>
);

export default function AccountSettingsScreen() {
  const { signOut, user, username, userStatus, getAccessToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [fullUser, setFullUser] = useState<any>(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const userId = userStatus?.userId;
      if (!userId) return;

      try {
        const token = await getAccessToken();
        if (!token) return;

        const data = await getUserById(token, String(userId));
        setFullUser(data);
        setAvatarLoaded(true);
      } catch (err) {
        console.error('Settings: failed to load user', err);
        setAvatarLoaded(true); // still show fallback
      }
    };

    fetchUser();
  }, [userStatus?.userId]);

  // getAvatarById always returns a valid asset (falls back to AVATAR_OPTIONS[0])
  const avatarSource = getAvatarById(fullUser?.profile_photo_id).source;

  const handleSignOut = () => {
    console.log('Signing out.');
    signOut();
  };

  // This spacer matches exactly what [id].tsx uses for the profile screen
  const topSpacerHeight = insets.top + HEADER_HEIGHT;

  return (
    <View style={styles.container}>
      {/* Spacer — same approach as the profile screen */}
      <View style={{ height: topSpacerHeight }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header ── */}
        <View style={styles.headerRow}>
          <View style={styles.avatarRingOuter}>
            <View style={styles.avatarRingInner}>
              {avatarLoaded ? (
                <Image source={avatarSource} style={styles.profileImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <ActivityIndicator size="small" color={Theme.dark.primary} />
                </View>
              )}
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>
              {fullUser?.name || userStatus?.user?.name || 'Name'}
            </Text>
            <Text style={styles.profileUsername}>
              @{fullUser?.username || username || 'username'}
            </Text>
            {(user?.email || fullUser?.email) ? (
              <Text style={styles.profileEmail}>
                {user?.email || fullUser?.email}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Account ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingsItem icon="user" text="Change Username" onPress={() => router.push('/account/change-username')} />
          <SettingsItem icon="edit" text="Edit Bio" onPress={() => router.push('/account/edit-bio')} />
          <SettingsItem icon="camera" text="Change Profile Picture" onPress={() => router.push('/account/change-profile-picture')} />
        </View>

        {/* ── Settings & Privacy ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Settings & Privacy</Text>
          <SettingsItem icon="bell" text="Notification Settings" onPress={() => router.push('/account/notifications')} />
          <SettingsItem icon="shield" text="Privacy Settings" onPress={() => router.push('/account/privacy')} />
          <SettingsItem icon="map-marker" text="Location Visibility" onPress={() => router.push('/account/location-settings')} />
        </View>

        {/* ── Log Out & Delete ── */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Log Out & Delete Account</Text>
          <SettingsItem
            icon="sign-out"
            text="Log Out"
            onPress={handleSignOut}
            color={Theme.dark.primary}
            showArrow={false}
          />
          <SettingsItem
            icon="trash"
            text="Delete Account"
            onPress={() => router.push('/account/delete-account')}
            color={Theme.dark.error}
            showArrow={false}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 24,
  },
  avatarRingOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: Theme.container.mainBorder,
    padding: 2,
    marginRight: 14,
  },
  avatarRingInner: {
    flex: 1,
    borderRadius: 34,
    overflow: 'hidden',
    backgroundColor: Theme.dark.background,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 34,
    transform: [{ scale: 1.12 }],
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    color: Theme.dark.white,
    fontSize: 18,
    fontWeight: '700',
  },
  profileUsername: {
    color: Theme.container.inactiveText,
    fontSize: 13,
    marginTop: 2,
  },
  profileEmail: {
    color: Theme.container.inactiveText,
    fontSize: 12,
    marginTop: 1,
  },
  sectionContainer: {
    backgroundColor: Theme.container.background,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Theme.container.mainBorder,
  },
  sectionTitle: {
    color: Theme.dark.white,
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.5,
    paddingVertical: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: Theme.container.mainBorder,
  },
  icon: {
    width: 28,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
});
