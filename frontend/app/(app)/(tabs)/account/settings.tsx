
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Stack, router } from 'expo-router'; // Import router

export default function AccountSettingsScreen(): JSX.Element {

  const handleSignOut = () => {
    console.log('Signing out...');
    // router.replace('/login');
  };

  const handleDeleteAccount = () => {
    console.log('Deleting account...');
    // Show a confirmation modal first
  };

  // Helper component for a consistent row style
  const SettingsItem = ({
    icon,
    text,
    onPress,
    color = '#E5E5EE',
  }: {
    icon: keyof typeof FontAwesome.glyphMap; // Use icon name as type
    text: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <FontAwesome name={icon} size={20} color={color} style={styles.icon} />
      <Text style={[styles.settingText, { color }]}>{text}</Text>
      <FontAwesome name="chevron-right" size={16} color="#555" />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Set the header title */}
      <Stack.Screen options={{ title: 'Settings' }} />

      {/* Header Section */}
      <View style={styles.headerRow}>
        <Image
          source={require('../../../../assets/images/Logo.png')}
          style={styles.profileImage}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{'Your Name'}</Text>
          <Text style={styles.profileEmail}>{'your@email.com'}</Text>
        </View>
      </View>

      {/* --- Account Section --- */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingsItem
          icon="user"
          text="Change Username"
          onPress={() => router.push('/account/change-username')}
        />
        <SettingsItem
          icon="envelope"
          text="Change Email"
          onPress={() => router.push('/account/change-email')}
        />
        <SettingsItem
          icon="lock"
          text="Change Password"
          onPress={() => router.push('/account/change-password')}
        />
        <SettingsItem
          icon="id-card"
          text="Verify Age"
          onPress={() => router.push('/account/verify-age')}
        />
      </View>

      {/* --- Settings & Privacy Section --- */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Settings & Privacy</Text>
        <SettingsItem
          icon="bell"
          text="Notification Settings"
          onPress={() => router.push('/account/notifications')}
        />
        <SettingsItem
          icon="shield"
          text="Privacy Settings"
          onPress={() => router.push('/account/privacy')}
        />
        <SettingsItem
          icon="map-marker"
          text="Location Visibility"
          onPress={() => router.push('/account/location')}
        />
      </View>

      {/* --- Danger Zone Section --- */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <SettingsItem
          icon="sign-out"
          text="Log Out"
          onPress={handleSignOut}
          color="#33CCFF" // Using your theme's blue
        />
        <SettingsItem
          icon="trash"
          text="Delete Account"
          onPress={handleDeleteAccount}
          color="#FF453A" // A standard "danger" red
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b12',
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
    width: 30, // Ensures text aligns
  },
  settingText: {
    flex: 1,
    color: '#E5E5EE',
    fontSize: 16,
    marginLeft: 10,
  },
});


// import React from 'react';
// import {
//   View,
//   Text,
//   Image,
//   TextInput,
//   TouchableOpacity,
//   ScrollView,
//   StyleSheet,
//   ImageSourcePropType,
// } from 'react-native';
// import { FontAwesome } from '@expo/vector-icons';
// import { Stack } from 'expo-router'; // Import Stack for header
//
// export default function AccountSettingsScreen() {
//     // Mock auth functions for the buttons
//     const handleSignOut = () => {
//         console.log('Signing out...');
//     };
//
//     return (
//         <ScrollView
//             style={styles.container}
//             contentContainerStyle={{ paddingBottom: 80 }}
//             showsVerticalScrollIndicator={false}
//         >
//
//         <Stack.Screen options={{ title: 'Settings' }} />
//
//         <View style={styles.headerRow}>
//             <Image
//                 source={require('../../../../assets/images/Logo.png')}
//                 style={styles.profileImage}
//             />
//             <View style={{ flex: 1 }}>
//                 <Text style={styles.profileName}>{'Your Name'}</Text>
//                 <Text style={styles.profileEmail}>{'your.name@email.com'}</Text>
//             </View>
//             <TouchableOpacity onPress={handleSignOut}>
//                 <FontAwesome name="sign-out" size={24} color="#33CCFF" />
//             </TouchableOpacity>
//         </View>
//
//         <View style={styles.sectionContainer}>
//             <Text style={styles.sectionTitle}>Edit Account Details</Text>
//
//             <Text style={styles.inputLabel}>Name</Text>
//             <TextInput
//                 placeholder="Enter your name"
//                 placeholderTextColor="#777"
//                 defaultValue="EmptyName"
//                 style={styles.input}
//             />
//
//             <Text style={styles.inputLabel}>Email</Text>
//             <TextInput
//                 placeholder="Enter your email"
//                 placeholderTextColor="#777"
//                 defaultValue={'email'} // Use defaultValue
//                 style={styles.input}
//             />
//         </View>
//
//         <View style={styles.sectionContainer}>
//             <Text style={styles.sectionTitle}>Settings</Text>
//             <TouchableOpacity style={styles.settingItem}>
//                 <Text style={styles.settingText}>Privacy Preferences</Text>
//                 <Text style={styles.arrow}>{'>'}</Text>
//             </TouchableOpacity>
//             <TouchableOpacity style={styles.settingItem}>
//                 <Text style={styles.settingText}>Notification Settings</Text>
//                 <Text style={styles.arrow}>{'>'}</Text>
//             </TouchableOpacity>
//         </View>
//
//         <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
//             <Text style={styles.logoutText}>Log Out</Text>
//         </TouchableOpacity>
//     </ScrollView>
//   );
// }
//
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#0b0b12',
//     },
//     headerRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         padding: 16,
//     },
//     profileImage: {
//         width: 70,
//         height: 70,
//         borderRadius: 12,
//         marginRight: 12,
//     },
//     profileName: {
//         color: 'white',
//         fontSize: 20,
//         fontWeight: '700',
//     },
//     profileEmail: {
//         color: 'white',
//         fontSize: 14,
//     },
//     statsRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-around',
//         paddingVertical: 10,
//         marginHorizontal: 12,
//     },
//     sectionContainer: {
//         backgroundColor: '#1A1A1A',
//         borderRadius: 12,
//         padding: 14,
//         marginHorizontal: 12,
//         marginVertical: 6,
//       },
//       sectionTitle: {
//         color: 'white',
//         fontSize: 18,
//         fontWeight: '600',
//         marginBottom: 10,
//     },
//     inputLabel: {
//         color: '#ccc',
//         fontSize: 14,
//         marginBottom: 6,
//     },
//     input: {
//         backgroundColor: '#2A2A2A',
//         color: 'white',
//         borderRadius: 8,
//         padding: 10,
//         marginBottom: 12,
//     },
//     settingItem: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         paddingVertical: 10,
//     },
//     settingText: {
//         color: '#E5E5E5',
//         fontSize: 14,
//     },
//     arrow: {
//         color: '#E5E5E5',
//         fontSize: 18,
//         fontWeight: '800',
//     },
//     logoutButton: {
//         backgroundColor: '#33CCFF',
//         marginHorizontal: 20,
//         borderRadius: 12,
//         padding: 12,
//         alignItems: 'center',
//         marginTop: 20,
//     },
//     logoutText: {
//         color: 'white',
//         fontWeight: '600',
//         fontSize: 16,
//     },
// });