import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, PanResponder, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { Theme } from '@/constants/theme';
import { formatLastActive } from '@/utils/location-utils';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { BarLocation, FriendLocation, GroupLocation } from '@/types/locations';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    location: (BarLocation | FriendLocation | GroupLocation | {
        id: number;
        name: string;
        profile_pic_url?: string;
        isSelf: true;
        atBarName?: string;
    }) | null;
    onClose: () => void;
    onViewDetails: () => void;
    onSelectLocation: (loc: (BarLocation | FriendLocation | GroupLocation | {
        id: number;
        name: string;
        profile_pic_url?: string;
        isSelf: true;
        atBarName?: string;
    }) | null) => void;
    isGhostModeEnabled: boolean;
    isGhostModeLoading: boolean;
    onToggleGhostMode: () => void;
}

export const MapBottomSheet = ({
    location,
    onClose,
    onViewDetails,
    onSelectLocation,
    isGhostModeEnabled,
    isGhostModeLoading,
    onToggleGhostMode,
}: Props) => {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const router = useRouter();

    const insets = useSafeAreaInsets();

    const isFriend = (loc: any): loc is FriendLocation => !!loc && 'username' in loc && !('friends' in loc);
    const isGroup = (loc: any): loc is GroupLocation => !!loc && 'friends' in loc;
    const isSelf = (loc: any): loc is { id: number; name: string; profile_pic_url?: string; isSelf: true; atBarName?: string } =>
        !!loc && loc.isSelf === true;

    // const friendUpdatedAt = isFriend(location) ? location.user_locations?.updated_at : undefined;
    // Fallback to either key to be safe
    const friendLoc = isFriend(location) ? (location.location || location.user_locations) : undefined;
    const friendUpdatedAt = friendLoc?.updated_at;

    const friendStatus = friendUpdatedAt ? `Active ${formatLastActive(friendUpdatedAt)}` : 'Last active unknown';
    const friendSubtitle = isFriend(location)
        ? location.atBarName
            ? `${friendStatus} at ${location.atBarName}`
            : friendStatus
        : 'Last active unknown';
    const selfSubtitle = isSelf(location)
        ? (location.atBarName ? `You are currently at ${location.atBarName}` : 'You are not currently at a tracked bar')
        : '';

    const title = isFriend(location)
        ? location.name
        : isGroup(location)
            ? `${location.friends.length} Friends`
            : isSelf(location)
                ? location.name
                : location?.name;

    const subtitle = isFriend(location)
        ? friendSubtitle
        : isGroup(location)
            ? `at ${location.bar.name}`
            : isSelf(location)
                ? selfSubtitle
                : location?.hours;

    const displayImage = (isFriend(location) || isSelf(location))
        ? { uri: location.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(location.name)}&background=${isSelf(location) ? '00EAFF' : '7b61ff'}&color=fff` }
        : isGroup(location)
            ? location.bar.logo
            : location?.logo;

    const panResponder = useRef(
        PanResponder.create({

            onStartShouldSetPanResponder: () => false,

            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,

            onPanResponderMove: (_, gesture) => { if (gesture.dy > 0) slideAnim.setValue(gesture.dy); },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy > 100 || gesture.vy > 0.5) onClose();
                else Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }).start();
            },
        })
    ).current;

    const [previousGroup, setPreviousGroup] = React.useState<GroupLocation | null>(null);
    useEffect(() => {

        if (previousGroup) {
            const isFriendFromPreviousGroup =
                isFriend(location) &&
                previousGroup.friends.some(friend => friend.id === location.id);
            if (!isFriendFromPreviousGroup) {
                setPreviousGroup(null);
            }
        }

    }, [location, previousGroup]);

    const handleBack = () => {
        if (previousGroup) {
            onSelectLocation(previousGroup);
            setPreviousGroup(null);
        }
    };

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: location ? 0 : SCREEN_HEIGHT,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start();
    }, [location]);

    if (!location) return null;

    return (
        <Animated.View
            pointerEvents={location ? 'auto' : 'none'}
            style={[
                styles.bottomSheet,
                {
                    transform: [{ translateY: slideAnim }],
                    paddingBottom: insets.bottom + 60
                }
            ]}
        >
            <View style={styles.sheetContent}>

                <View {...panResponder.panHandlers} style={styles.dragArea}>
                    <View style={styles.dragHandle} />
                </View>

                <View style={styles.sheetHeader}>
                    {/* Only show if coming from a group */}
                    {previousGroup && isFriend(location) && (
                        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                    )}

                    <Image
                        source={displayImage}
                        style={[
                            styles.sheetLogo,
                            (isFriend(location) || isGroup(location)) && styles.friendAvatar,
                            isSelf(location) && { borderColor: '#00EAFF', borderRadius: 16 },
                        ]}
                    />
                    <View style={styles.textContainer}>
                        <Text style={styles.modalTitle} numberOfLines={1}>{title}</Text>
                        <Text style={styles.modalBodyText}>{subtitle}</Text>
                    </View>
                </View>

                {isGroup(location) ? (
                    <View style={styles.friendListContainer}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: 200 }}
                            nestedScrollEnabled={true}
                        >
                            {location.friends.map((f) => (
                                <TouchableOpacity
                                    key={f.id}
                                    style={styles.friendListRow}
                                    onPress={() => {
                                        setPreviousGroup(location as GroupLocation);
                                        onSelectLocation({ ...f, atBarName: location.bar.name });
                                    }}
                                >
                                    <Image
                                        source={{ uri: f.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.name)}&background=7b61ff&color=fff` }}
                                        style={styles.listAvatar}
                                    />
                                    <View style={styles.listTextContainer}>
                                        <Text style={styles.listName}>{f.name}</Text>
                                        <Text style={styles.listUsername}>@{f.username}</Text>
                                    </View>
                                    <FontAwesome name="chevron-right" size={14} color="#666" />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                ) : isFriend(location) ? (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: Theme.dark.accent }]}
                        onPress={() => {
                            router.push(`/(app)/(tabs)/account/${location.id}`);
                            onClose();
                        }}
                    >
                        <Text style={styles.buttonText}>{`View ${location.name}'s Profile`}</Text>
                    </TouchableOpacity>
                ) : isSelf(location) ? (
                    <TouchableOpacity
                        style={[
                            styles.button,
                            {
                                // Toggle between solid blue and a dark outline
                                backgroundColor: isGhostModeEnabled ? 'transparent' : '#00EAFF',
                                borderColor: '#00EAFF',
                                borderWidth: 2,
                                opacity: isGhostModeLoading ? 0.7 : 1
                            }
                        ]}
                        onPress={onToggleGhostMode}
                        disabled={isGhostModeLoading}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <FontAwesome
                                name={isGhostModeEnabled ? "eye-slash" : "eye"}
                                size={18}
                                color={isGhostModeEnabled ? '#00EAFF' : '#000'}
                            />
                            <Text style={[
                                styles.buttonText,
                                { color: isGhostModeEnabled ? '#00EAFF' : '#000' }
                            ]}>
                                {isGhostModeLoading
                                    ? 'Updating...'
                                    : isGhostModeEnabled
                                        ? 'Ghost Mode: ON (1 hour)'
                                        : 'Ghost Mode: OFF'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.button} onPress={onViewDetails}>
                        <Text style={styles.barDetailsButtonText}>
                            View <Text style={styles.barNameText}>{location?.name ?? 'Bar'}</Text> Details
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
                    <Text style={styles.buttonText}>Dismiss</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(20, 20, 25, 0.98)',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 8,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        zIndex: 9999,
    },
    dragArea: {
        width: '100%',
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dragHandle: {
        width: 36,
        height: 4,
        backgroundColor: '#444',
        borderRadius: 2,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
        gap: 16,
    },
    sheetLogo: {
        width: 64,
        height: 64,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Theme.dark.primary,
        marginLeft: 0,
    },
    friendAvatar: {
        borderRadius: 16,
        borderColor: Theme.dark.accent,
    },
    textContainer: {
        flex: 1,
    },
    sheetContent: {
        width: '100%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    modalBodyText: {
        fontSize: 15,
        color: '#AAA',
        marginTop: 2,
    },
    friendListContainer: {
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    friendListRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        gap: 12,
    },
    listAvatar: {
        width: 40,
        height: 40,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.dark.accent,
    },
    listTextContainer: {
        flex: 1,
    },
    listName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    listUsername: {
        fontSize: 13,
        color: '#AAAAAA',
    },
    button: {
        backgroundColor: Theme.dark.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    barDetailsButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    barNameText: {
        fontWeight: '800',
    },
    closeButton: {
        backgroundColor: '#222',
    },
    backButton: {
        paddingRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});