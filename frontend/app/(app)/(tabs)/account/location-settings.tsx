import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Stack, router } from "expo-router";
import { FontAwesome } from '@expo/vector-icons';

import { Friend } from '@/types/types';
import { shouldForceErrorPage } from '@/utils/dev-error-pages';
import { getUserById, getUserFriends } from '@/services/userService';
import { UserLocationService, type LocationSharingPreference } from '@/services/userLocationService';
import ErrorState from '@/components/ui/error-state';
import { useUser } from '@/context/user-context';

type VisibilityMode = 'ALL' | 'SOME' | 'NONE';

export default function LocationVisibilityScreen() {
  const { user } = useUser();
  const userId = Number(user?.id);

  // State Management
  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('ALL');
  const [search, setSearch] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Helper: Map Backend DB strings to UI Modes
  const mapPreferenceToMode = (preference?: string, ghostExpiresAt?: string | null): VisibilityMode => {
    const ghostActive = !!ghostExpiresAt && new Date(ghostExpiresAt).getTime() > Date.now();
    if (ghostActive) return 'NONE';
    if (preference === 'PUBLIC') return 'ALL';
    if (preference === 'PRIVATE') return 'NONE';
    return 'SOME';
  };

  // Helper: Extract Viewer IDs from Prisma Relation
  const extractSelectedFriendIds = (userData: any): string[] => {
    // Matches the relation name in your Prisma/Express backend
    const permissions =
      userData?.user_settings?.location_permissions_location_permissions_owner_idTousers ||
      userData?.location_permissions_location_permissions_owner_idTousers ||
      [];
    return permissions.map((p: any) => String(p.viewer_id || p.viewerId));
  };

  useEffect(() => {
    const initData = async () => {
      if (!Number.isFinite(userId)) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [friendsData, currentUserData] = await Promise.all([
          getUserFriends(userId),
          getUserById(userId),
        ]);

        setFriends(friendsData || []);

        const settings = currentUserData?.user_settings || currentUserData;
        setVisibilityMode(mapPreferenceToMode(
          settings?.location_sharing_preference,
          settings?.ghost_mode_expires_at
        ));

        console.log("Raw Backend Permissions:", currentUserData?.location_permissions_location_permissions_owner_idTousers);
        console.log("Extracted IDs:", extractSelectedFriendIds(currentUserData));

        setSelectedFriends(extractSelectedFriendIds(currentUserData));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load settings'));
      } finally {
        setLoading(false);
      }
    };
    initData();

  }, [userId]);

  const filteredFriends = useMemo(() => {
    return friends.filter((f) =>
      (f.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.username || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [friends, search]);

  const toggleFriendSelection = (id: string | number) => {
    const idString = String(id);
    setSelectedFriends((prev) =>
      prev.includes(idString)
        ? prev.filter((fid) => fid !== idString)
        : [...prev, idString]
    );
  };

  const handleSave = async () => {
    if (!Number.isFinite(userId)) return;

    setIsSaving(true);
    try {
      const prefMap: Record<VisibilityMode, LocationSharingPreference> = {
        ALL: 'PUBLIC',
        SOME: 'SELECTIVE',
        NONE: 'PRIVATE',
      };

      // 1. Update general preference (PATCH /:userId/preference)
      await UserLocationService.updateSharingPreference(userId, prefMap[visibilityMode]);

      // 2. Toggle Ghost Mode (POST /:userId/ghost)
      await UserLocationService.setGhostMode(userId, visibilityMode === 'NONE' ? 24 : 0);

      // 3. Update Permissions (Only if mode is SOME/SELECTIVE)
      if (visibilityMode === 'SOME') {
        const selectedSet = new Set(selectedFriends);

        // TODO: Build a batch endpoint on backend to avoid multiple parallel requests
        await Promise.all(
          friends.map((friend) => {
            const isAllowed = selectedSet.has(String(friend.id));
            return UserLocationService.setViewerPermission(Number(friend.id), userId, isAllowed);
          })
        );
      }

      Alert.alert("Success", "Privacy settings updated!");
      router.back();
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Could not save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const ModeCard = ({ mode, title, icon, description }: { mode: VisibilityMode, title: string, icon: string, description: string }) => {
    const isSelected = visibilityMode === mode;
    return (
      <TouchableOpacity
        style={[styles.modeCard, isSelected && styles.selectedModeCard]}
        onPress={() => setVisibilityMode(mode)}
        activeOpacity={0.7}
      >
        <View style={styles.modeIconContainer}>
          <FontAwesome name={icon as any} size={22} color={isSelected ? "#33CCFF" : "#555"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.modeTitle, isSelected && { color: '#33CCFF' }]}>{title}</Text>
          <Text style={styles.modeDescription}>{description}</Text>
        </View>
        <FontAwesome name={isSelected ? "dot-circle-o" : "circle-o"} size={20} color={isSelected ? "#33CCFF" : "#333"} />
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator size="large" color="#33CCFF" />
    </View>
  );

  if (error || shouldForceErrorPage('locationSettings')) return <ErrorState title="Oops!" subtitle="Could not load your settings." />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <View style={styles.container}>
        <Stack.Screen options={{
          title: 'Location Visibility',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={styles.headerButtonBubble}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#33CCFF" />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          ),
        }} />

        <FlatList
          data={visibilityMode === 'SOME' ? filteredFriends : []}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={{ paddingBottom: 10 }}>
              <Text style={styles.sectionHeader}>PRIVACY MODE</Text>
              <ModeCard mode="ALL" title="Share with All" icon="users" description="Visible to all friends." />
              <ModeCard mode="SOME" title="Share with Some" icon="user-plus" description="Pick specific friends below." />
              <ModeCard mode="NONE" title="Ghost Mode" icon="eye-slash" description="Completely invisible to everyone." />

              {visibilityMode === 'SOME' && (
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.sectionHeader}>SELECT FRIENDS ({selectedFriends.length})</Text>
                  <View style={styles.searchContainer}>
                    <FontAwesome name="search" size={16} color="#888" />
                    <TextInput
                      style={styles.input}
                      placeholder="Search friends..."
                      placeholderTextColor="#666"
                      value={search}
                      onChangeText={setSearch}
                    />
                  </View>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedFriends.includes(String(item.id));
            return (
              <TouchableOpacity
                style={[styles.friendItem, isSelected && styles.selectedFriend]}
                onPress={() => toggleFriendSelection(item.id)}
                activeOpacity={0.7}
              >
                <Image source={item.avatar ? { uri: item.avatar } : require('../../../../assets/images/Logo.png')} style={styles.friendAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendName}>{item.name}</Text>
                  <Text style={styles.friendStatus}>@{item.username}</Text>
                </View>
                <FontAwesome name={isSelected ? "check-square" : "square-o"} size={22} color={isSelected ? "#33CCFF" : "#333"} />
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={visibilityMode === 'NONE' ? (
            <View style={styles.ghostContainer}>
              <FontAwesome name="eye-slash" size={65} color="#33CCFF" style={{ opacity: 0.6 }} />
              <Text style={styles.ghostTitle}>Going Invisible</Text>
              <Text style={styles.ghostSub}>Your location is hidden from everyone.</Text>
            </View>
          ) : null}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12", padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  headerButtonBubble: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    minHeight: 34,
  },
  saveText: {
    color: '#33CCFF',
    fontSize: 14,
    fontWeight: '700',
    includeFontPadding: false,
    textAlign: 'center'
  },
  sectionHeader: { color: '#666', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10, marginTop: 10 },
  modeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 18, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#1f2937' },
  selectedModeCard: { borderColor: '#33CCFF', backgroundColor: '#1e3a5f33' },
  modeIconContainer: { width: 45 },
  modeTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  modeDescription: { color: '#888', fontSize: 13, marginTop: 3 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 14, paddingHorizontal: 15, height: 48, marginBottom: 15, borderWidth: 1, borderColor: "#1f2937" },
  input: { flex: 1, marginLeft: 10, color: "white", fontSize: 15 },
  friendItem: { padding: 14, backgroundColor: "#0f172a", borderRadius: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: "#1f2937" },
  selectedFriend: { borderColor: '#33CCFF' },
  friendAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#1f2937' },
  friendName: { color: "white", fontSize: 15, fontWeight: '600' },
  friendStatus: { color: '#666', fontSize: 12 },
  ghostContainer: { marginTop: 60, alignItems: 'center' },
  ghostTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginTop: 20 },
  ghostSub: { color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center' },
  listContent: { paddingBottom: 140 } // Clears the nav bar completely
});