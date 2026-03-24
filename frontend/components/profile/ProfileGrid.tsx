import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Image, StyleSheet, TouchableOpacity,
    Modal, FlatList, TouchableWithoutFeedback, Animated
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { updateUser } from '@/services/userService';
import { useAuth } from '@/hooks/use-auth';

import { DRINK_OPTIONS, getDrinkById, ProfileAsset } from '@/constants/profileAssets';
import { getBarAssets } from '@/utils/bar-assets';
import { apiFetch } from '@/services/apiClient';

// Default bar when favorite_profile_location_id is null
const DEFAULT_BAR_NAME = "Cy's Roost";

// All available bars for the picker — name must match bar-assets.ts keys
const BAR_OPTIONS = [
    { id: 1,  name: "AJ's Ultralounge" },
    { id: 2,  name: "BNC Fieldhouse" },
    { id: 3,  name: "Cy's Roost" },
    { id: 4,  name: "Welch Ave Station" },
    { id: 5,  name: "The Blue Owl Bar" },
    { id: 6,  name: "Paddy's Irish Pub" },
    { id: 7,  name: "Sips" },
    { id: 8,  name: "Mickey's Irish Pub" },
    { id: 9,  name: "Outlaws" },
];

// ─────────────────────────────────────────────────────────────────────────────
// BAR PICKER MODAL
// ─────────────────────────────────────────────────────────────────────────────
type BarPickerModalProps = {
    visible: boolean;
    selectedName: string;
    onSelect: (bar: { id: number; name: string }) => void;
    onClose: () => void;
};

function BarPickerModal({ visible, selectedName, onSelect, onClose }: BarPickerModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={pickerStyles.overlay}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={pickerStyles.sheet}>
                            <View style={pickerStyles.header}>
                                <Text style={pickerStyles.title}>Choose Favorite Bar</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <Text style={pickerStyles.closeBtn}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={BAR_OPTIONS}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                renderItem={({ item }) => {
                                    const assets = getBarAssets({ name: item.name });
                                    const isSelected = item.name === selectedName;
                                    return (
                                        <TouchableOpacity
                                            style={[barPickerStyles.row, isSelected && barPickerStyles.rowSelected]}
                                            onPress={() => { onSelect(item); onClose(); }}
                                        >
                                            <Image source={assets.logo} style={barPickerStyles.logo} />
                                            <Text style={barPickerStyles.name}>{item.name}</Text>
                                            {isSelected && (
                                                <FontAwesome name="check" size={16} color={Theme.dark.primary} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE PICKER MODAL
// ─────────────────────────────────────────────────────────────────────────────
type ImagePickerModalProps = {
    visible: boolean;
    options: ProfileAsset[];
    selectedId: number;
    onSelect: (item: ProfileAsset) => void;
    onClose: () => void;
};

function ImagePickerModal({ visible, options, selectedId, onSelect, onClose }: ImagePickerModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={pickerStyles.overlay}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={pickerStyles.sheet}>
                            <View style={pickerStyles.header}>
                                <Text style={pickerStyles.title}>Choose Favorite Drink</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <Text style={pickerStyles.closeBtn}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={options}
                                keyExtractor={(item) => item.id.toString()}
                                numColumns={3}
                                contentContainerStyle={pickerStyles.grid}
                                renderItem={({ item }) => {
                                    const isSelected = item.id === selectedId;
                                    return (
                                        <TouchableOpacity
                                            style={[pickerStyles.imageCell, isSelected && pickerStyles.imageCellSelected]}
                                            onPress={() => { onSelect(item); onClose(); }}
                                        >
                                            <Image source={item.source} style={pickerStyles.optionImage} />
                                            {isSelected && (
                                                <View style={pickerStyles.checkBadge}>
                                                    <FontAwesome name="check" size={10} color="#fff" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const pickerStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Theme.container.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        paddingBottom: 32,
        maxHeight: '65%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    title: { color: Theme.dark.white, fontSize: 18, fontWeight: '700' },
    closeBtn: { color: Theme.container.inactiveText, fontSize: 22 },
    grid: { paddingHorizontal: 12, paddingTop: 12 },
    imageCell: {
        flex: 1,
        margin: 5,
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    imageCellSelected: { borderColor: Theme.dark.primary },
    optionImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    checkBadge: {
        position: 'absolute',
        top: 6, right: 6,
        backgroundColor: Theme.dark.primary,
        borderRadius: 999,
        width: 20, height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE GRID
// ─────────────────────────────────────────────────────────────────────────────
export const ProfileGrid = ({ user, isMe, isEditing }: { user: any; isMe?: boolean; isEditing?: boolean }) => {
    const { userStatus } = useAuth();

    const [selectedDrink, setSelectedDrink] = useState<ProfileAsset>(() => getDrinkById(user?.favorite_drink_id));
    const [isDrinkPickerVisible, setDrinkPickerVisible] = useState(false);

    // Wiggle animation
    const wiggle = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (isEditing) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(wiggle, { toValue: 1, duration: 100, useNativeDriver: true }),
                    Animated.timing(wiggle, { toValue: -1, duration: 100, useNativeDriver: true }),
                    Animated.timing(wiggle, { toValue: 0, duration: 100, useNativeDriver: true }),
                    Animated.delay(1200),
                ])
            ).start();
        } else {
            wiggle.stopAnimation();
            wiggle.setValue(0);
        }
    }, [isEditing]);

    const wiggleStyle = {
        transform: [{
            rotate: wiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-1.5deg', '1.5deg'] })
        }]
    };

    // ── Fav bar ───────────────────────────────────────────────────────────────
    const [favBarName, setFavBarName] = useState<string>(DEFAULT_BAR_NAME);
    const [isBarPickerVisible, setBarPickerVisible] = useState(false);

    const handleBarSelect = async (bar: { id: number; name: string }) => {
        setFavBarName(bar.name);
        if (!userStatus?.userId) return;
        try {
            await updateUser(userStatus.userId, { favorite_profile_location_id: bar.id } as any);
        } catch (err) {
            console.error('Failed to save fav bar:', err);
        }
    };

    useEffect(() => {
        const fetchFavBar = async () => {
            if (!user?.favorite_profile_location_id) {
                setFavBarName(DEFAULT_BAR_NAME);
                return;
            }
            try {
                const location = await apiFetch(`/locations/${user.favorite_profile_location_id}`);
                if (location?.name) setFavBarName(location.name);
            } catch (err) {
                console.error('Failed to fetch fav bar:', err);
                setFavBarName(DEFAULT_BAR_NAME);
            }
        };
        fetchFavBar();
    }, [user?.favorite_profile_location_id]);

    const favBarAssets = getBarAssets({ name: favBarName });

    const handleDrinkSelect = async (item: ProfileAsset) => {
        setSelectedDrink(item);
        if (!userStatus?.userId) return;
        try {
            await updateUser(userStatus.userId, { favorite_drink_id: item.id } as any);
        } catch (err) {
            console.error('Failed to save drink:', err);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.gridRow}>
                {/* Favorite Drink */}
                {isMe ? (
                    <Animated.View style={[{ flex: 1 }, isEditing && wiggleStyle]}>
                        <TouchableOpacity
                            style={styles.featureCard}
                            onPress={() => isEditing && setDrinkPickerVisible(true)}
                        >
                            <Text style={styles.featureTitle}>Favorite Drink</Text>
                            <View style={styles.drinkImageWrapper}>
                                <Image source={selectedDrink.source} style={styles.drinkImage} />
                                {isEditing && (
                                    <View style={styles.drinkEditBadge}>
                                        <FontAwesome name="pencil" size={10} color="#fff" />
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    <View style={styles.featureCard}>
                        <Text style={styles.featureTitle}>Favorite Drink</Text>
                        <View style={styles.drinkImageWrapper}>
                            <Image source={selectedDrink.source} style={styles.drinkImage} />
                        </View>
                    </View>
                )}

                {/* Streak */}
                <View style={styles.featureCard}>
                    <Text style={styles.featureTitle}>Streak</Text>
                    <View style={styles.streakContent}>
                        <Text style={styles.streakNumber}>🔥 {user?.streak || 0}</Text>
                        <Text style={styles.statLabel}>weekends out in a row</Text>
                    </View>
                </View>
            </View>

            {/* Favorite Bar */}
            {isMe ? (
                <Animated.View style={[isEditing && wiggleStyle]}>
                    <TouchableOpacity
                        style={styles.largeCard}
                        onPress={() => isEditing && setBarPickerVisible(true)}
                    >
                        <Text style={styles.featureTitle}>Favorite Bar</Text>
                        <View style={styles.favBarImageWrapper}>
                            <Image source={favBarAssets.cover} style={styles.favBarCover} />
                            <View style={styles.favBarOverlay} />
                            <View style={styles.favBarInfo}>
                                <Image source={favBarAssets.logo} style={styles.favBarLogo} />
                                <Text style={styles.favBarName}>{favBarName}</Text>
                            </View>
                            {isEditing && (
                                <View style={styles.favBarEditBadge}>
                                    <FontAwesome name="pencil" size={10} color="#fff" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <View style={styles.largeCard}>
                    <Text style={styles.featureTitle}>Favorite Bar</Text>
                    <View style={styles.favBarImageWrapper}>
                        <Image source={favBarAssets.cover} style={styles.favBarCover} />
                        <View style={styles.favBarOverlay} />
                        <View style={styles.favBarInfo}>
                            <Image source={favBarAssets.logo} style={styles.favBarLogo} />
                            <Text style={styles.favBarName}>{favBarName}</Text>
                        </View>
                    </View>
                </View>
            )}

            {isMe && (
                <BarPickerModal
                    visible={isBarPickerVisible}
                    selectedName={favBarName}
                    onSelect={handleBarSelect}
                    onClose={() => setBarPickerVisible(false)}
                />
            )}

            {isMe && (
                <ImagePickerModal
                    visible={isDrinkPickerVisible}
                    options={DRINK_OPTIONS}
                    selectedId={selectedDrink.id}
                    onSelect={handleDrinkSelect}
                    onClose={() => setDrinkPickerVisible(false)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    gridRow: {
        marginBottom: 15,
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 15,
    },
    featureCard: {
        flex: 1,
        backgroundColor: Theme.container.background,
        borderRadius: 16,
        padding: 10,
        minHeight: 145,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    featureTitle: {
        color: Theme.dark.white,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    drinkImageWrapper: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 2,
        aspectRatio: 1,
        alignSelf: 'stretch',
        position: 'relative',
    },
    drinkImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },
    drinkEditBadge: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: Theme.dark.primary,
        borderRadius: 999,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.dark.background,
    },
    streakContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakNumber: {
        color: Theme.dark.tertiary,
        fontSize: 52,
        fontWeight: 'bold',
    },
    statLabel: {
        color: Theme.container.inactiveText,
        fontSize: 12,
        textAlign: 'center',
    },
    largeCard: {
        width: '100%',
        backgroundColor: Theme.container.background,
        borderRadius: 12,
        padding: 10,
        height: 180,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        marginBottom: 15,
    },
    favBarImageWrapper: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    favBarCover: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    favBarOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    favBarInfo: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    favBarLogo: {
        width: 36,
        height: 36,
        borderRadius: 8,
        resizeMode: 'contain',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    favBarEditBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: Theme.dark.primary,
        borderRadius: 999,
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.dark.background,
    },
    favBarName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
});

const barPickerStyles = {
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: Theme.container.mainBorder,
        gap: 12,
    } as const,
    rowSelected: {
        backgroundColor: Theme.search.background,
    } as const,
    logo: {
        width: 40,
        height: 40,
        borderRadius: 8,
        resizeMode: 'contain',
    } as const,
    name: {
        flex: 1,
        color: Theme.dark.white,
        fontSize: 16,
        fontWeight: '600',
    } as const,
};

