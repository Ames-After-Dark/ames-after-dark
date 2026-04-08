import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Image, StyleSheet, TouchableOpacity,
    Modal, FlatList, TouchableWithoutFeedback, Animated
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { updateUser } from '@/services/userService';
import { useAuth } from '@/hooks/use-auth';
import { router } from 'expo-router';

import { DRINK_OPTIONS, getDrinkById, ProfileAsset } from '@/utils/profileAssets';
import { getBarAssets } from '@/utils/bar-assets';
import { apiFetch } from '@/services/apiClient';

// Default bar when favorite_profile_location_id is null
const DEFAULT_BAR_NAME = "Cy's Roost";

// ─────────────────────────────────────────────────────────────────────────────
// BAR PICKER MODAL
// ─────────────────────────────────────────────────────────────────────────────
type BarPickerModalProps = {
    visible: boolean;
    selectedName: string;
    bars: { id: number; name: string }[];
    onSelect: (bar: { id: number; name: string }) => void;
    onClose: () => void;
};

function BarPickerModal({ visible, selectedName, bars, onSelect, onClose }: BarPickerModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={pickerStyles.overlay}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View style={pickerStyles.sheet}>
                            <View style={pickerStyles.header}>
                                <Text style={pickerStyles.title}>Choose Favorite Bar</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <Text style={pickerStyles.closeBtn}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={bars}
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
                    <TouchableWithoutFeedback onPress={() => { }}>
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
// ZOOM MODAL — drink or streak zoomed-in view
// ─────────────────────────────────────────────────────────────────────────────
type ZoomModalProps = {
    visible: boolean;
    type: 'drink' | 'streak' | null;
    drinkSource?: any;
    streakCount?: number;
    isMe?: boolean;
    onChangeDrink: () => void;
    onClose: () => void;
};

function ZoomModal({ visible, type, drinkSource, streakCount, isMe, onChangeDrink, onClose }: ZoomModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={zoomStyles.overlay}>
                    <TouchableWithoutFeedback onPress={() => { }}>
                        <View style={zoomStyles.card}>
                            {/* Pink X close button */}
                            <TouchableOpacity style={zoomStyles.closeBtn} onPress={onClose}>
                                <View style={zoomStyles.closeBtnCircle}>
                                    <FontAwesome name="times" size={14} color="#fff" />
                                </View>
                            </TouchableOpacity>

                            <Text style={zoomStyles.label}>
                                {type === 'drink' ? 'Favorite Drink' : 'Streak'}
                            </Text>

                            {type === 'drink' && drinkSource ? (
                                <>
                                    <Image source={drinkSource} style={zoomStyles.drinkImage} />
                                    {isMe && (
                                        <TouchableOpacity
                                            style={zoomStyles.changeDrinkBtn}
                                            onPress={() => { onClose(); setTimeout(onChangeDrink, 300); }}
                                        >
                                            <Text style={zoomStyles.changeDrinkText}>Change Drink</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            ) : (
                                <View style={zoomStyles.streakZoom}>
                                    <Text style={zoomStyles.streakEmoji}>🔥</Text>
                                    <Text style={zoomStyles.streakBig}>{streakCount ?? 0}</Text>
                                    <Text style={zoomStyles.streakSub}>weekends out in a row</Text>
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const zoomStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.88)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        width: '80%',
        backgroundColor: Theme.container.background,
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        position: 'relative',
        maxHeight: '70%',
    },
    closeBtn: {
        position: 'absolute',
        top: -12,
        right: -12,
        zIndex: 10,
    },
    closeBtnCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FF2D78',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.dark.background,
    },
    label: {
        color: Theme.dark.white,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    drinkImage: {
        width: '100%',
        height: 220,
        borderRadius: 16,
        marginBottom: 24,
        resizeMode: 'contain',
    },
    changeDrinkBtn: {
        backgroundColor: '#FF2D78',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
    },
    changeDrinkText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    streakZoom: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    streakEmoji: {
        fontSize: 56,
        marginBottom: 8,
    },
    streakBig: {
        color: Theme.dark.tertiary,
        fontSize: 72,
        fontWeight: 'bold',
        lineHeight: 80,
    },
    streakSub: {
        color: Theme.container.inactiveText,
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE GRID
// ─────────────────────────────────────────────────────────────────────────────
export const ProfileGrid = ({ user, isMe, isEditing }: { user: any; isMe?: boolean; isEditing?: boolean }) => {
    const { userStatus, getAccessToken } = useAuth();

    const [selectedDrink, setSelectedDrink] = useState<ProfileAsset>(() => getDrinkById(user?.favorite_drink_id));
    const [isDrinkPickerVisible, setDrinkPickerVisible] = useState(false);
    const [zoomModal, setZoomModal] = useState<'drink' | 'streak' | null>(null);

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
    const [favBarLocationId, setFavBarLocationId] = useState<number>(user?.favorite_profile_location_id ?? 3);
    const [isBarPickerVisible, setBarPickerVisible] = useState(false);
    const [barOptions, setBarOptions] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        apiFetch('/locations')
            .then((data: any) => {
                if (Array.isArray(data)) {
                    setBarOptions(data.map((loc: any) => ({ id: loc.id, name: loc.name })));
                }
            })
            .catch((err: any) => console.error('Failed to fetch bar list:', err));
    }, []);

    const handleBarSelect = async (bar: { id: number; name: string }) => {
        setFavBarName(bar.name);
        setFavBarLocationId(bar.id);
        if (!userStatus?.userId) return;
        try {
            const token = await getAccessToken();
            if (!token) return;
            await updateUser(token, String(userStatus.userId), { favorite_profile_location_id: bar.id } as any);
        } catch (err) {
            console.error('Failed to save fav bar:', err);
        }
    };

    const handleBarPress = () => {
        if (isMe && isEditing) {
            setBarPickerVisible(true);
        } else {
            const barId = favBarLocationId ?? user?.favorite_profile_location_id ?? 3;
            router.push(`/bars/${barId}` as any);
        }
    };

    useEffect(() => {
        const fetchFavBar = async () => {
            if (!user?.favorite_profile_location_id) {
                setFavBarName(DEFAULT_BAR_NAME);
                setFavBarLocationId(3);
                return;
            }
            try {
                const location = await apiFetch(`/locations/${user.favorite_profile_location_id}`);
                if (location?.name) setFavBarName(location.name);
                setFavBarLocationId(user.favorite_profile_location_id);
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
            const token = await getAccessToken();
            if (!token) return;
            await updateUser(token, String(userStatus.userId), { favorite_drink_id: item.id } as any);
        } catch (err) {
            console.error('Failed to save drink:', err);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.gridRow}>
                {/* Favorite Drink — tappable on all pages */}
                <Animated.View style={[{ flex: 1 }, isMe && isEditing && wiggleStyle]}>
                    <TouchableOpacity style={[styles.featureCard, { flex: 1 }]} onPress={() => setZoomModal('drink')}>
                        <Text style={styles.featureTitle}>Favorite Drink</Text>
                        <View style={styles.drinkImageWrapper}>
                            <Image source={selectedDrink.source} style={styles.drinkImage} />
                            {isMe && isEditing && (
                                <View style={styles.drinkEditBadge}>
                                    <FontAwesome name="pencil" size={10} color="#fff" />
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* Streak — tappable on all pages */}
                <TouchableOpacity style={styles.featureCard} onPress={() => setZoomModal('streak')}>
                    <Text style={styles.featureTitle}>Streak</Text>
                    <View style={styles.streakContent}>
                        <Text style={styles.streakNumber}>🔥 {user?.streak || 0}</Text>
                        <Text style={styles.statLabel}>weekends out in a row</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Favorite Bar — tappable on all pages */}
            <Animated.View style={[isMe && isEditing && wiggleStyle]}>
                <TouchableOpacity style={styles.largeCard} onPress={handleBarPress}>
                    <Text style={styles.featureTitle}>Favorite Bar</Text>
                    <View style={styles.favBarImageWrapper}>
                        <Image source={favBarAssets.cover} style={styles.favBarCover} />
                        <View style={styles.favBarOverlay} />
                        <View style={styles.favBarInfo}>
                            <Image source={favBarAssets.logo} style={styles.favBarLogo} />
                            <Text style={styles.favBarName}>{favBarName}</Text>
                        </View>
                        {isMe && isEditing && (
                            <View style={styles.favBarEditBadge}>
                                <FontAwesome name="pencil" size={10} color="#fff" />
                            </View>
                        )}
                        {!isMe && (
                            <View style={styles.favBarVisitBadge}>
                                <FontAwesome name="chevron-right" size={11} color="#fff" />
                            </View>
                        )}
                    </View>
                </TouchableOpacity>
            </Animated.View>

            {/* Zoom Modal */}
            <ZoomModal
                visible={zoomModal !== null}
                type={zoomModal}
                drinkSource={selectedDrink.source}
                streakCount={user?.streak || 0}
                isMe={isMe}
                onChangeDrink={() => setDrinkPickerVisible(true)}
                onClose={() => setZoomModal(null)}
            />

            {isMe && (
                <BarPickerModal
                    visible={isBarPickerVisible}
                    selectedName={favBarName}
                    bars={barOptions}
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
        gap: 15,
    },
    gridRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        height: 180,
        gap: 15,
    },
    featureCard: {
        flex: 1,
        backgroundColor: Theme.container.background,
        borderRadius: 16,
        padding: 10,
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
    favBarVisitBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 999,
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
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
