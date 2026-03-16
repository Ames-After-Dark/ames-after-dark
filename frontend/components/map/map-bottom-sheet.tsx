import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, PanResponder, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { Theme } from '@/constants/theme';
import { formatLastActive } from '@/utils/location-utils';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { BarLocation, FriendLocation, GroupLocation } from '@/types/locations';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    location: BarLocation | FriendLocation | GroupLocation | null;
    onClose: () => void;
    onViewDetails: () => void;
    onSelectLocation: (loc: BarLocation | FriendLocation | GroupLocation | null) => void;
}

export const MapBottomSheet = ({ location, onClose, onViewDetails, onSelectLocation }: Props) => {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const router = useRouter();

    // Type Guards
    const isFriend = (loc: any): loc is FriendLocation => !!loc && 'username' in loc && !('friends' in loc);
    const isGroup = (loc: any): loc is GroupLocation => !!loc && 'friends' in loc;
    const isBar = (loc: any): loc is BarLocation => !!loc && 'name' in loc && !('username' in loc) && !('friends' in loc);

    // Extraction logic
    const title = isFriend(location) ? location.name : isGroup(location) ? `${location.friends.length} Friends` : location?.name;
    const subtitle = isFriend(location) ? `Active ${formatLastActive(location.user_locations?.updated_at)}` : isGroup(location) ? `at ${location.bar.name}` : location?.hours;
    const displayImage = isFriend(location)
        ? { uri: location.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(location.name)}&background=7b61ff&color=fff` }
        : isGroup(location) ? location.bar.logo : location?.logo;

    const panResponder = useRef(
        PanResponder.create({
            // Change this to false! 
            // We only want the responder to take over when the user starts DRAGGING.
            onStartShouldSetPanResponder: () => false,

            // This ensures touches pass through to buttons UNLESS the user moves their finger
            onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,

            onPanResponderMove: (_, gesture) => { if (gesture.dy > 0) slideAnim.setValue(gesture.dy); },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy > 100 || gesture.vy > 0.5) onClose();
                else Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }).start();
            },
        })
    ).current;

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
            style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}
        >
            <View style={styles.sheetContent}>
                {/* Drag Area stays at the very top */}
                <View {...panResponder.panHandlers} style={styles.dragArea}>
                    <View style={styles.dragHandle} />
                </View>

                {/* Header Section */}
                <View style={styles.sheetHeader}>
                    <Image
                        source={displayImage}
                        style={[styles.sheetLogo, (isFriend(location) || isGroup(location)) && styles.friendAvatar]}
                    />
                    <View style={styles.textContainer}>
                        <Text style={styles.modalTitle} numberOfLines={1}>{title}</Text>
                        <Text style={styles.modalBodyText}>{subtitle}</Text>
                    </View>
                </View>

                {/* Middle Content Section */}
                {isGroup(location) ? (
                    <View style={styles.friendListContainer}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: 200 }}
                            // This ensures the ScrollView doesn't fight with the PanResponder
                            nestedScrollEnabled={true}
                        >
                            {location.friends.map((f) => (
                                <TouchableOpacity
                                    key={f.id}
                                    style={styles.friendListRow}
                                    onPress={() => onSelectLocation(f)}
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
                        style={[styles.button, { backgroundColor: '#7b61ff' }]}
                        onPress={() => {
                            router.push({ pathname: "/account/[id]", params: { id: String(location.id) } } as any);
                            onClose();
                        }}
                    >
                        <Text style={styles.buttonText}>View {location.name}'s Profile</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.button} onPress={onViewDetails}>
                        <Text style={styles.buttonText}>View Bar Details</Text>
                    </TouchableOpacity>
                )}

                {/* Single Dismiss Button at the bottom */}
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
        paddingBottom: 34, // Extra padding for the iOS home indicator
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
    },
    friendAvatar: {
        borderRadius: 16,
        borderColor: '#7b61ff',
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
        borderColor: '#7b61ff',
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
    closeButton: {
        backgroundColor: '#222',
    }
});