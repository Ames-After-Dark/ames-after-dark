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
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

import { Friend } from '@/types/types';
import { shouldForceErrorPage } from '@/utils/dev-error-pages';
import { getUserById, getUserFriends } from '@/services/userService';
import { UserLocationService, type LocationSharingPreference } from '@/services/userLocationService';
import ErrorState from '@/components/ui/error-state';
import { useUser } from '@/context/user-context';

type VisibilityMode = 'ALL' | 'SOME' | 'NONE';

export default function LocationVisibilityScreen() {
<<<<<<< HEAD
  const { user } = useUser();
  const userId = Number(user?.id);

  const [visibilityMode, setVisibilityMode] = useState<VisibilityMode>('ALL');
=======
  const { user, getAccessToken } = useAuth();
  const [shareWithAll, setShareWithAll] = useState(true);
>>>>>>> bb891552d3367168e860413050080ca47428059d
  const [search, setSearch] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const extractSelectedFriendIds = (userData: any): string[] => {
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
<<<<<<< HEAD
        setLoading(true);
        const [friendsData, currentUserData] = await Promise.all([
          getUserFriends(userId),
          getUserById(userId),
        ]);

=======
        const token = await getAccessToken();
        if (!token) return;

        const friendsData = await getUserFriends(token);
>>>>>>> bb891552d3367168e860413050080ca47428059d
        setFriends(friendsData || []);
        const settings = currentUserData?.user_settings || currentUserData;

        const ghostActive = !!settings?.ghost_mode_expires_at && new Date(settings.ghost_mode_expires_at).getTime() > Date.now();
        if (ghostActive) setVisibilityMode('NONE');
        else if (settings?.location_sharing_preference === 'PUBLIC') setVisibilityMode('ALL');
        else if (settings?.location_sharing_preference === 'PRIVATE') setVisibilityMode('NONE');
        else setVisibilityMode('SOME');

        setSelectedFriends(extractSelectedFriendIds(currentUserData));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load settings'));
      } finally {
        setLoading(false);
      }
    };
<<<<<<< HEAD
    initData();
  }, [userId]);
=======
    fetchFriends();
  }, [getAccessToken]);
>>>>>>> bb891552d3367168e860413050080ca47428059d

  const filteredFriends = useMemo(() => {
    return friends.filter((f) =>
      (f.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.username || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [friends, search]);

  const toggleFriendSelection = (id: string | number) => {
    const idString = String(id);
    setSelectedFriends((prev) =>
      prev.includes(idString) ? prev.filter((fid) => fid !== idString) : [...prev, idString]
    );
  };

  // const handleSave = async () => {
  //   if (!Number.isFinite(userId)) return;
  //   setIsSaving(true);
  //   try {
  //     const prefMap: Record<VisibilityMode, LocationSharingPreference> = {
  //       ALL: 'PUBLIC', SOME: 'SELECTIVE', NONE: 'PRIVATE',
  //     };
  //     await UserLocationService.updateSharingPreference(userId, prefMap[visibilityMode]);
  //     await UserLocationService.setGhostMode(userId, visibilityMode === 'NONE' ? 24 : 0);
  //     if (visibilityMode === 'SOME') {
  //       const selectedSet = new Set(selectedFriends);
  //       await Promise.all(
  //         friends.map((friend) => UserLocationService.setViewerPermission(Number(friend.id), userId, selectedSet.has(String(friend.id))))
  //       );
  //     }
  //     Alert.alert("Success", "Privacy settings updated!");
  //     router.back();
  //   } catch (err) {
  //     Alert.alert('Error', 'Could not save settings.');
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  const handleSave = async () => {
    if (!Number.isFinite(userId)) return;

    setIsSaving(true);
    setShowSuccess(false); // Reset success state if they save again

    try {
      const prefMap: Record<VisibilityMode, LocationSharingPreference> = {
        ALL: 'PUBLIC', SOME: 'SELECTIVE', NONE: 'PRIVATE',
      };

      // Run your API calls
      await UserLocationService.updateSharingPreference(userId, prefMap[visibilityMode]);
      await UserLocationService.setGhostMode(userId, visibilityMode === 'NONE' ? 24 : 0);

      if (visibilityMode === 'SOME') {
        const selectedSet = new Set(selectedFriends);
        await Promise.all(
          friends.map((friend) =>
            UserLocationService.setViewerPermission(Number(friend.id), userId, selectedSet.has(String(friend.id)))
          )
        );
      }

      // 2. SUCCESS FEEDBACK (Instead of router.back())
      setIsSaving(false);
      setShowSuccess(true);

      // Hide the "Success" state after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (err) {
      setIsSaving(false);
      Alert.alert('Error', 'Could not save settings.');
    }
  };

  const ModeRow = ({ mode, title, icon, description, isLast }: { mode: VisibilityMode, title: string, icon: string, description: string, isLast?: boolean }) => {
    const isSelected = visibilityMode === mode;
    return (
      <TouchableOpacity
        style={[styles.modeRow, isSelected && styles.selectedModeRow]}
        onPress={() => setVisibilityMode(mode)}
        activeOpacity={0.7}
      >
        {isSelected && <View style={styles.neonAccentBar} />}
        <View style={styles.modeIconContainer}>
          <FontAwesome name={icon as any} size={20} color={isSelected ? "#33CCFF" : "#4b5563"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.modeTitle, isSelected && { color: '#33CCFF' }]}>{title}</Text>
          <Text style={styles.modeDescription}>{description}</Text>
        </View>
        <FontAwesome name={isSelected ? "dot-circle-o" : "circle-o"} size={20} color={isSelected ? "#33CCFF" : "#1f2937"} />
        {!isLast && <View style={styles.innerDivider} />}
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#33CCFF" /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }} keyboardVerticalOffset={100}>
      <View style={styles.container}>
        {/* <Stack.Screen options={{
          title: 'Location Visibility',
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.headerButtonBubble}>
              {isSaving ? <ActivityIndicator size="small" color="#33CCFF" /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
          ),
        }} /> */}

        <Stack.Screen options={{
          title: 'Location Visibility',
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving || showSuccess}
              style={[
                styles.headerButtonBubble,
                showSuccess && { borderColor: '#4ADE80', backgroundColor: 'rgba(74, 222, 128, 0.1)' }
              ]}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#33CCFF" />
              ) : showSuccess ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome name="check" size={12} color="#4ADE80" style={{ marginRight: 4 }} />
                  <Text style={[styles.saveText, { color: '#4ADE80' }]}>Saved</Text>
                </View>
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
            <View>
              <Text style={styles.sectionHeader}>PRIVACY MODE</Text>
              <View style={styles.sectionGroup}>
                <ModeRow mode="ALL" title="Share with All" icon="users" description="Visible to all friends." />
                <ModeRow mode="SOME" title="Share with Some" icon="user-plus" description="Pick specific friends below." />
                <ModeRow mode="NONE" title="Ghost Mode" icon="eye-slash" description="Completely invisible." isLast />
              </View>

              {visibilityMode === 'SOME' && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.sectionHeader}>SELECT FRIENDS ({selectedFriends.length})</Text>
                  <View style={styles.searchContainer}>
                    <FontAwesome name="search" size={16} color="#4b5563" />
                    <TextInput style={styles.input} placeholder="Search friends..." placeholderTextColor="#4b5563" value={search} onChangeText={setSearch} />
                  </View>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedFriends.includes(String(item.id));
            return (
              <TouchableOpacity style={[styles.friendItem, isSelected && styles.selectedFriend]} onPress={() => toggleFriendSelection(item.id)}>
                <Image source={item.avatar ? { uri: item.avatar } : require('../../../../assets/images/Logo.png')} style={styles.friendAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendName}>{item.name}</Text>
                  <Text style={styles.friendStatus}>@{item.username}</Text>
                </View>
                <FontAwesome name={isSelected ? "check-circle" : "circle-thin"} size={22} color={isSelected ? "#33CCFF" : "#1f2937"} />
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={(() => {
            if (visibilityMode === 'NONE') {
              return (
                <View style={styles.statusContainer}>
                  <MaterialCommunityIcons name="moon-waning-crescent" size={60} color="#33CCFF" style={{ opacity: 0.6 }} />
                  <Text style={styles.statusTitle}>Ghost Mode Active</Text>
                  <Text style={styles.statusSub}>You're off the grid. No one can see you.</Text>
                </View>
              );
            }
            if (visibilityMode === 'ALL') {
              return (
                <View style={styles.statusContainer}>
                  <MaterialCommunityIcons name="radar" size={60} color="#33CCFF" style={{ opacity: 0.6 }} />
                  <Text style={styles.statusTitle}>Broadcasting Location</Text>
                  <Text style={styles.statusSub}>All your friends can see where you are.</Text>
                </View>
              );
            }
            return null;
          })()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12", paddingHorizontal: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  // Header
  headerButtonBubble: { backgroundColor: 'rgba(51, 204, 255, 0.1)', height: 32, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: '#33CCFF', justifyContent: 'center', alignItems: 'center' },
  saveText: { color: '#33CCFF', fontSize: 14, fontWeight: '800', includeFontPadding: false },
  sectionHeader: { color: '#4b5563', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 10, marginTop: 10, textTransform: 'uppercase' },
  // Grouped Modes
  sectionGroup: { backgroundColor: "#0f172a", borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: "#1f2937", marginBottom: 20 },
  modeRow: { flexDirection: 'row', alignItems: 'center', padding: 18, position: 'relative' },
  selectedModeRow: { backgroundColor: 'rgba(51, 204, 255, 0.03)' },
  innerDivider: { position: 'absolute', bottom: 0, left: 60, right: 0, height: 1, backgroundColor: '#1f2937' },
  neonAccentBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, backgroundColor: '#33CCFF', borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  modeIconContainer: { width: 42 },
  modeTitle: { color: 'white', fontSize: 16, fontWeight: '700' },
  modeDescription: { color: '#666', fontSize: 12, marginTop: 2 },
  // Search & Friends
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161b22', borderRadius: 14, paddingHorizontal: 15, height: 44, marginBottom: 15 },
  input: { flex: 1, marginLeft: 10, color: "white", fontSize: 15 },
  friendItem: { padding: 14, backgroundColor: "#0f172a", borderRadius: 18, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: "#1f2937" },
  selectedFriend: { borderColor: 'rgba(51, 204, 255, 0.3)', backgroundColor: 'rgba(51, 204, 255, 0.02)' },
  friendAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: '#1f2937' },
  friendName: { color: "white", fontSize: 15, fontWeight: '600' },
  friendStatus: { color: '#4b5563', fontSize: 12 },
  // Empty States / Status
  statusContainer: { marginTop: 60, alignItems: 'center' },
  statusTitle: { color: 'white', fontSize: 20, fontWeight: '700', marginTop: 20 },
  statusSub: { color: '#666', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
  listContent: { paddingBottom: 140 }
});