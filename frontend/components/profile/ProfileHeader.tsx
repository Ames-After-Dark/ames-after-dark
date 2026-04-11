import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Image, StyleSheet, TouchableOpacity,
    Modal, FlatList, TouchableWithoutFeedback, Animated
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { updateUser } from '@/services/userService';
import { useAuth } from '@/hooks/use-auth';

import { AVATAR_OPTIONS, getAvatarById, ProfileAsset } from '@/utils/profileAssets';
import { router } from 'expo-router';

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
                                <Text style={pickerStyles.title}>Choose Profile Photo</Text>
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

const pickerStyles = {
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    } as const,
    sheet: {
        backgroundColor: Theme.container.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        paddingBottom: 32,
        maxHeight: '65%',
    } as const,
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: Theme.container.mainBorder,
    } as const,
    title: { color: Theme.dark.white, fontSize: 18, fontWeight: '700' } as const,
    closeBtn: { color: Theme.container.inactiveText, fontSize: 22 } as const,
    grid: { paddingHorizontal: 12, paddingTop: 12 } as const,
    imageCell: {
        flex: 1,
        margin: 5,
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    } as const,
    imageCellSelected: { borderColor: Theme.dark.primary } as const,
    optionImage: { width: '100%', height: '100%', resizeMode: 'cover' } as const,
    checkBadge: {
        position: 'absolute',
        top: 6, right: 6,
        backgroundColor: Theme.dark.primary,
        borderRadius: 999,
        width: 20, height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    } as const,
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE HEADER
// ─────────────────────────────────────────────────────────────────────────────
interface ProfileHeaderProps {
    user: any;
    isMe?: boolean;
    showFriendStats?: boolean;
    showBio?: boolean;
    onlyBio?: boolean;
    friendCount?: number;
    mutualCount?: number;
    isEditing?: boolean;
    onRequestEdit?: () => void;
    onSave?: () => void;
    onEditBio?: () => void;
    onPressFriends?: () => void;
    onPressMutuals?: () => void;
}

export const ProfileHeader = ({ user, isMe, showFriendStats, showBio, onlyBio, friendCount, mutualCount, isEditing, onRequestEdit, onSave, onEditBio, onPressFriends, onPressMutuals }: ProfileHeaderProps): React.JSX.Element => {
    const { userStatus, getAccessToken } = useAuth();

    const [selectedAvatar, setSelectedAvatar] = useState<ProfileAsset>(() => getAvatarById(user?.profile_photo_id));
    const [isPickerVisible, setPickerVisible] = useState(false);
    const [isEditPromptVisible, setEditPromptVisible] = useState(false);

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

    const handleAvatarSelect = async (item: ProfileAsset) => {
        setSelectedAvatar(item);
        if (!userStatus?.userId) return;
        try {
            const token = await getAccessToken();
            if (!token) return;
            await updateUser(token, String(userStatus.userId), { profile_photo_id: item.id } as any);
        } catch (err) {
            console.error('Failed to save avatar:', err);
        }
    };

    if (onlyBio) {
        if (!showBio) return <View />;
        return (
            <View style={styles.sidePadding}>
                <Animated.View style={[styles.bioContainer, isEditing && wiggleStyle]}>
                    <Text style={styles.bioText}>
                        {user?.bio
                            ? user.bio
                            : `${user?.name || 'This user'} hasn't added a bio yet. They're a mystery! 🕵️‍♂️`}
                    </Text>
                    {isMe && isEditing && (
                        <TouchableOpacity onPress={onEditBio} style={styles.bioEditBadgeTouch}>
                            <View style={styles.bioEditBadge}>
                                <FontAwesome name="pencil" size={10} color="#fff" />
                            </View>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </View>
        );
    }

    const avatarSource = isMe
        ? selectedAvatar.source
        : user?.avatar
            ? (typeof user.avatar === 'string' ? { uri: user.avatar } : user.avatar)
            : require('@/assets/images/Logo.png');

    const shouldShowStats = Boolean(isMe || showFriendStats);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                {isMe ? (
                    <TouchableOpacity
                        onPress={() => {
                            if (isEditing) {
                                setPickerVisible(true);
                            } else {
                                setEditPromptVisible(true);
                            }
                        }}
                        style={styles.avatarWrapper}
                    >
                        <Animated.View style={isEditing ? wiggleStyle : undefined}>
                            <View style={styles.avatarRingOuter}>
                                <View style={styles.avatarRingInner}>
                                    <Image source={selectedAvatar.source} style={styles.profileImage} />
                                </View>
                            </View>
                            <View style={styles.avatarEditBadge}>
                                <FontAwesome name="pencil" size={10} color="#fff" />
                            </View>
                        </Animated.View>
                    </TouchableOpacity>
                ) : (
                    <Image source={avatarSource} style={styles.profileImageFriend} />
                )}

                <View style={styles.infoContainer}>
                    <View style={styles.nameRow}>
                        <Text style={styles.profileName}>{user?.name || 'Loading...'}</Text>
                        {isMe && (
                            isEditing ? (
                                <TouchableOpacity onPress={onSave} style={styles.saveButton}>
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </TouchableOpacity>
                            ) : null
                        )}
                    </View>
                    <Text style={styles.usernameText}>@{user?.username || 'username'}</Text>
                    {shouldShowStats && (
                        <View style={styles.statsRow}>
                            <TouchableOpacity style={styles.statButton} onPress={onPressFriends}>
                                <Text style={styles.statNumber}>{friendCount ?? 0}</Text>
                                <Text style={styles.statLabel}>friends</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.statButton} onPress={onPressMutuals}>
                                <Text style={styles.statNumber}>{mutualCount ?? 0}</Text>
                                <Text style={styles.statLabel}>{isMe ? 'pending' : 'mutual'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {showBio && (
                <View style={styles.bioContainer}>
                    <Text style={styles.bioText}>
                        {user?.bio || "No bio yet. Add one to tell others about yourself!"}
                    </Text>
                    {isMe && isEditing && (
                        <Animated.View style={[styles.bioEditBadge, wiggleStyle]}>
                            <FontAwesome name="pencil" size={10} color="#fff" />
                        </Animated.View>
                    )}
                </View>
            )}

            {isMe && (
                <ImagePickerModal
                    visible={isPickerVisible}
                    options={AVATAR_OPTIONS}
                    selectedId={selectedAvatar.id}
                    onSelect={handleAvatarSelect}
                    onClose={() => setPickerVisible(false)}
                />
            )}

            {/* Custom edit prompt — replaces native Alert */}
            <Modal visible={isEditPromptVisible} transparent animationType="fade" onRequestClose={() => setEditPromptVisible(false)}>
                <TouchableWithoutFeedback onPress={() => setEditPromptVisible(false)}>
                    <View style={styles.promptOverlay}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View style={styles.promptCard}>
                                <Text style={styles.promptTitle}>Edit Profile</Text>
                                <Text style={styles.promptSubtitle}>Would you like to edit your profile?</Text>
                                <TouchableOpacity
                                    style={styles.promptConfirm}
                                    onPress={() => { setEditPromptVisible(false); onRequestEdit?.(); }}
                                >
                                    <Text style={styles.promptConfirmText}>Yes, Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setEditPromptVisible(false)}>
                                    <Text style={styles.promptCancel}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 4,
        marginBottom: 4,
    },
    sidePadding: {
        paddingHorizontal: 0,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 8,
    },
    avatarWrapper: {
        position: 'relative',
        marginRight: 15,
    },
    avatarRingOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: Theme.container.mainBorder,
        padding: 2,
    },
    avatarRingInner: {
        flex: 1,
        borderRadius: 57,
        overflow: 'hidden',
        backgroundColor: Theme.dark.background,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 57,
        transform: [{ scale: 1.12 }],
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Theme.dark.primary,
        borderRadius: 999,
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.dark.background,
    },
    profileImageFriend: {
        width: 75,
        height: 75,
        borderRadius: 15,
        marginRight: 15,
    },
    infoContainer: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 8,
    },
    statButton: {
        flex: 1,
        backgroundColor: Theme.container.background,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: {
        color: Theme.dark.white,
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        color: Theme.container.inactiveText,
        fontSize: 11,
        marginTop: 2,
    },
    profileName: {
        color: Theme.dark.white,
        fontSize: 22,
        fontWeight: '700',
    },
    usernameText: {
        color: Theme.container.inactiveText,
        fontSize: 14,
    },
    bioContainer: {
        backgroundColor: Theme.container.background,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        marginTop: 4,
        position: 'relative',
    },
    bioText: {
        color: Theme.container.titleText,
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    saveButton: {
        backgroundColor: Theme.dark.primary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    bioEditBadge: {
        position: 'absolute',
        bottom: 8,
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
    bioEditBadgeTouch: {
        position: 'absolute',
        bottom: 8,
        right: 8,
    },
    promptOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    promptCard: {
        width: '78%',
        backgroundColor: Theme.container.background,
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    promptTitle: {
        color: Theme.dark.white,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    promptSubtitle: {
        color: Theme.container.inactiveText,
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
    },
    promptConfirm: {
        backgroundColor: Theme.dark.primary,
        width: '100%',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    promptConfirmText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    promptCancel: {
        color: Theme.container.inactiveText,
        fontSize: 14,
        fontWeight: '600',
    },
});
