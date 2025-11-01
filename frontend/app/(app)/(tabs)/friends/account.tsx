import React, { useState } from 'react';
import { View, Text, Image, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
// import { useAuth } from '@/hooks/use-auth';
import { FontAwesome } from '@expo/vector-icons';

export default function AccountScreen() {
  // const { user, signOut } = useAuth();
  // const [name, setName] = useState(user?.name || '');
  // const [email, setEmail] = useState(user?.email || '');

  //removed this from return statement:
  //  <View style={styles.logoutButtonContainer}>
  //    <Button title="Log Out" onPress={signOut} />
  //  </View>

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
      {/* Cover Photo */}
      <Image source={require('../../../../assets/images/Logo.png')} style={styles.coverPhoto} resizeMode="cover" />

      {/* Header Section */}
      <View style={styles.headerRow}>
        <Image source={require('../../../../assets/images/Logo.png')} style={styles.profileImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{'Your Name'}</Text>
          <Text style={styles.profileEmail}>{'your@email.com'}</Text>
        </View>
        <TouchableOpacity>
          <FontAwesome name="sign-out" size={24} color="#33CCFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Section */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Friends</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>5</Text>
          <Text style={styles.statLabel}>Events</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
      </View>

      {/* Account Details */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Edit Account Details</Text>

        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          placeholder="Enter your name"
          placeholderTextColor="#777"
          value="EmptyName"
          // onChangeText={setName}
          style={styles.input}
        />

        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          placeholder="Enter your email"
          placeholderTextColor="#777"
          value={"email"}
          // onChangeText={setEmail}
          style={styles.input}
        />
      </View>

      {/* Settings Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Privacy Preferences</Text>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Notification Settings</Text>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Log Out Button */}
      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b12',
  },
  coverPhoto: {
    width: '100%',
    height: 180,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    marginHorizontal: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: 'white',
    fontSize: 12,
  },
  sectionContainer: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#2A2A2A',
    color: 'white',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  settingText: {
    color: '#E5E5E5',
    fontSize: 14,
  },
  arrow: {
    color: '#E5E5E5',
    fontSize: 18,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: '#33CCFF',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
