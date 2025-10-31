import React from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function FriendsScreen() {
  const navigation = useNavigation();

  const friends = [
    {
      id: '1',
      name: 'Ava Johnson',
      image: require('../../../../assets/images/Logo.png'),
      bio: 'Loves hiking and photography',
      stats: { friends: 22, events: 4, achievements: 6 },
    },
    {
      id: '2',
      name: 'Liam Carter',
      image: require('../../../../assets/images/Logo.png'),
      bio: 'Coffee addict ☕ and night owl 🌙',
      stats: { friends: 17, events: 7, achievements: 3 },
    },
    {
      id: '3',
      name: 'Sophia Lee',
      image: require('../../../../assets/images/Logo.png'),
      bio: 'Music, travel, and good vibes 🎶✈️',
      stats: { friends: 30, events: 5, achievements: 8 },
    },
  ];

  const handleViewProfile = (friend) => {
    navigation.navigate('FriendProfile', { friend });
  };

  const goToAccount = () => {
    navigation.navigate('Account');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity onPress={goToAccount}>
          <FontAwesome name="gear" size={24} color="#33CCFF" />
        </TouchableOpacity>
      </View>

      {/* Friend List */}
      <View style={styles.friendList}>
        {friends.map((friend) => (
          <TouchableOpacity
            key={friend.id}
            style={styles.friendCard}
            onPress={() => handleViewProfile(friend)}
          >
            <Image source={friend.image} style={styles.friendImage} />
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{friend.name}</Text>
              <Text style={styles.friendSubtitle}>{friend.bio}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b12',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
  },
  friendList: {
    gap: 12,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
  },
  friendImage: {
    width: 55,
    height: 55,
    borderRadius: 10,
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  friendSubtitle: {
    color: '#AAA',
    fontSize: 13,
  },
});
