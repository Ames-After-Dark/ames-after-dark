import React from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useMapLocations } from "@/hooks/useMapLocations";
import { useFriendsLocations } from "@/hooks/useLocationTracker";
import { useUser } from "@/context/user-context";
import { groupFriendsByNearbyBar } from "@/utils/nearby-friends";
import { formatLastActive } from "@/utils/location-utils";
import { getLogoAssetForLocationName } from "@/utils/locationLogos";

type FriendsSectionProps = {
  query: string;
  onBarPress: (id: string) => void;
  onFriendPress: (friendId: number) => void;
};

export default function FriendsSection({ query, onBarPress, onFriendPress }: FriendsSectionProps) {
  const { user, isLoading: userLoading } = useUser();
  const { locations, isLoading: locationsLoading } = useMapLocations();
  const { friends, loading: friendsLoading } = useFriendsLocations(user?.id);
  const [expandedBarId, setExpandedBarId] = React.useState<string | null>(null);

  const nearbyGroups = React.useMemo(() => {
    const grouped = groupFriendsByNearbyBar(friends, locations);
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return grouped;
    }

    return grouped.filter((group) => {
      const barName = group.bar.name.toLowerCase();
      const friendMatch = group.friends.some((friend) => {
        const name = (friend.name || "").toLowerCase();
        const username = (friend.username || "").toLowerCase();
        const atBarName = (friend.atBarName || "").toLowerCase();
        return name.includes(normalizedQuery) || username.includes(normalizedQuery) || atBarName.includes(normalizedQuery);
      });

      return barName.includes(normalizedQuery) || friendMatch;
    });
  }, [friends, locations, query]);

  const isLoading = userLoading || locationsLoading || friendsLoading;

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="small" color={Theme.dark.primary} />
        <Text style={styles.stateText}>Finding nearby friends...</Text>
      </View>
    );
  }

  if (!user?.id) {
    return (
      <View style={styles.stateContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="people-outline" size={40} color={Theme.dark.primary} />
        </View>
        <Text style={styles.comingSoonHeader}>Connect your account</Text>
        <Text style={styles.emptyText}>
          Sign in to see which friends are currently hanging out nearby.
        </Text>
      </View>
    );
  }

  if (!nearbyGroups.length) {
    return (
      <View style={styles.stateContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="people-outline" size={40} color={Theme.dark.primary} />
        </View>
        <Text style={styles.comingSoonHeader}>
          {query.trim() ? "No matching nearby friends" : "No friends nearby right now"}
        </Text>
        <Text style={styles.emptyText}>
          {query.trim()
            ? "Try a different search term or clear the filter."
            : "We only show friends who are currently within a tracked bar radius."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerIcon}>
          <Ionicons name="people" size={18} color={Theme.dark.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Friends Near You</Text>
          <Text style={styles.sectionSubtitle}>
            {nearbyGroups.length} place{nearbyGroups.length === 1 ? "" : "s"} with friends nearby
          </Text>
        </View>
      </View>

      <View style={styles.cardsList}>
        {nearbyGroups.map((group) => {
          const barId = String(group.bar.id);
          const targetBarId = String(group.sourceBarId ?? group.bar.id);
          const isExpanded = expandedBarId === barId;
          const latestUpdatedAt = group.friends
            .map((friend) => friend.location?.updated_at || friend.user_locations?.updated_at)
            .filter((value): value is string => Boolean(value))
            .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0];

          const friendNames = group.friends.slice(0, 2).map((friend) => friend.name).join(", ");
          const extraCount = Math.max(0, group.friends.length - 2);

          return (
            <View
              key={String(group.bar.id)}
              style={[styles.cardShell, isExpanded && styles.cardShellExpanded]}
            >
              <Pressable
                style={styles.card}
                onPress={() => setExpandedBarId((current) => (current === barId ? null : barId))}
              >
                <Image
                  source={group.bar.logo || getLogoAssetForLocationName(group.bar.name)}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {group.bar.name}
                  </Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {friendNames}{extraCount > 0 ? ` +${extraCount}` : ""}
                  </Text>
                  <Text style={styles.cardDetail} numberOfLines={1}>
                    {latestUpdatedAt ? `Active ${formatLastActive(latestUpdatedAt)}` : "Active just now"}
                  </Text>
                </View>

                <View style={styles.avatarStack}>
                  {group.friends.slice(0, 3).map((friend, index) => (
                    <Image
                      key={friend.id}
                      source={{
                        uri:
                          friend.profile_pic_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=7b61ff&color=fff`,
                      }}
                      style={[styles.avatar, { marginLeft: index === 0 ? 0 : -10 }]}
                    />
                  ))}
                  {group.friends.length > 3 && (
                    <View style={[styles.moreBadge, { marginLeft: -10 }]}>
                      <Text style={styles.moreBadgeText}>+{group.friends.length - 3}</Text>
                    </View>
                  )}
                </View>

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Theme.search.inactiveInput}
                />
              </Pressable>

              {isExpanded && (
                <View style={styles.expandedPanel}>
                  <View style={styles.friendListHeader}>
                    <Text style={styles.friendListTitle}>Friends here</Text>
                    <Text style={styles.friendListCount}>{group.friends.length}</Text>
                  </View>

                  <View style={styles.friendList}>
                    {group.friends.map((friend) => {
                      const friendUpdatedAt = friend.location?.updated_at || friend.user_locations?.updated_at;

                      return (
                        <Pressable key={friend.id} style={styles.friendRow} onPress={() => onFriendPress(friend.id)}>
                          <Image
                            source={{
                              uri:
                                friend.profile_pic_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&background=7b61ff&color=fff`,
                            }}
                            style={styles.friendAvatar}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.friendName}>{friend.name}</Text>
                            <Text style={styles.friendMeta} numberOfLines={1}>
                              @{friend.username} {friendUpdatedAt ? `• ${formatLastActive(friendUpdatedAt)}` : ""}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color={Theme.search.inactiveInput} />
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.expandedActions}>
                    <Pressable style={styles.detailsButton} onPress={() => onBarPress(targetBarId)}>
                      <Text style={styles.detailsButtonText}>View Bar Details</Text>
                    </Pressable>
                    <Pressable style={styles.closeButton} onPress={() => setExpandedBarId(null)}>
                      <Text style={styles.closeButtonText}>Collapse</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 92,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Theme.search.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
  },
  sectionTitle: {
    color: Theme.container.titleText,
    fontSize: 16,
    fontWeight: "700",
  },
  sectionSubtitle: {
    color: Theme.container.inactiveText,
    fontSize: 12,
    marginTop: 2,
  },
  cardsList: {
    gap: 12,
  },
  cardShell: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
    backgroundColor: Theme.container.background,
    overflow: "hidden",
  },
  cardShellExpanded: {
    borderColor: Theme.dark.primary,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  cardImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
  },
  cardTitle: {
    color: Theme.container.titleText,
    fontWeight: "800",
    fontSize: 14,
  },
  cardSubtitle: {
    color: Theme.container.inactiveText,
    marginTop: 2,
    fontSize: 13,
  },
  cardDetail: {
    color: Theme.container.inactiveText,
    marginTop: 2,
    fontSize: 12,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 4,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.dark.accent,
    backgroundColor: Theme.search.background,
  },
  moreBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: Theme.dark.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.container.background,
  },
  moreBadgeText: {
    color: Theme.dark.background,
    fontSize: 10,
    fontWeight: "800",
  },
  expandedPanel: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Theme.container.secondaryBorder,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  friendListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  friendListTitle: {
    color: Theme.container.titleText,
    fontSize: 13,
    fontWeight: "700",
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  friendListCount: {
    color: Theme.container.inactiveText,
    fontSize: 12,
    fontWeight: "700",
  },
  friendList: {
    gap: 10,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  friendAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.dark.accent,
    backgroundColor: Theme.search.background,
  },
  friendName: {
    color: Theme.container.titleText,
    fontSize: 13,
    fontWeight: "700",
  },
  friendMeta: {
    color: Theme.container.inactiveText,
    fontSize: 12,
    marginTop: 1,
  },
  expandedActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: Theme.dark.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  detailsButtonText: {
    color: Theme.dark.white,
    fontWeight: "800",
    fontSize: 13,
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
    backgroundColor: Theme.search.background,
  },
  closeButtonText: {
    color: Theme.container.titleText,
    fontWeight: "700",
    fontSize: 13,
  },
  stateContainer: {
    flex: 1,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    minHeight: 280,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.search.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
  },
  comingSoonHeader: {
    color: Theme.container.titleText,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    color: Theme.container.inactiveText,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  stateText: {
    color: Theme.container.inactiveText,
    marginTop: 12,
    fontSize: 13,
  },
});