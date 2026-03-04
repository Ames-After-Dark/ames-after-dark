import React from 'react';
import { useAuth } from "@/hooks/use-auth"
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AccountSettingsScreen(): JSX.Element {
  const { signOut, user } = useAuth()

  const handleSignOut = () => {
    console.log('Signing out.');
    signOut();
  };


  const SettingsItem = ({ icon, text, onPress, color = '#E5E5EE', showArrow = true }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <FontAwesome name={icon} size={20} color={color} style={styles.icon} />
      <Text style={[styles.settingText, { color }]}>{text}</Text>
      {showArrow && <FontAwesome name="chevron-right" size={16} color="#555" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Image
          source={require('../../../../assets/images/Logo.png')}
          style={styles.profileImage}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>user.{user?.username || 'default'}</Text>
          <Text style={styles.profileEmail}>your@email.com</Text>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingsItem icon="user" text="Change Username" onPress={() => router.push('/account/change-username')} />
        <SettingsItem icon="edit" text="Edit Bio" onPress={() => router.push('/account/edit-bio')} />
        <SettingsItem icon="camera" text="Change Profile Picture" onPress={() => router.push('/account/change-profile-picture')} />
        <SettingsItem icon="envelope" text="Change Email" onPress={() => router.push('/account/change-email')} />
        <SettingsItem icon="lock" text="Change Password" onPress={() => router.push('/account/change-password')} />
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Settings & Privacy</Text>
        <SettingsItem icon="bell" text="Notification Settings" onPress={() => router.push('/account/notifications')} />
        <SettingsItem icon="shield" text="Privacy Settings" onPress={() => router.push('/account/privacy')} />
        <SettingsItem icon="map-marker" text="Location Visibility" onPress={() => router.push('/account/location-settings')} />
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Log Out & Delete Account</Text>
        {/* No arrow since it doesn’t navigate */}
        <SettingsItem icon="sign-out" text="Log Out" onPress={handleSignOut} color="#33CCFF" showArrow={false} />
        <SettingsItem icon="trash" text="Delete Account" onPress={() => router.push('/account/delete-account')} color="#FF453A" showArrow={false} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b12',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 20,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
  },
  profileName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  profileEmail: {
    color: 'white',
    fontSize: 14,
  },
  sectionContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: '#1f2937',
  },
  icon: {
    width: 30,
  },
  settingText: {
    flex: 1,
    color: '#E5E5EE',
    fontSize: 16,
    marginLeft: 10,
  },
});
