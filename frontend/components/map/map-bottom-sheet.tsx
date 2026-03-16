import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, PanResponder, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { Theme } from '@/constants/theme';
import { formatLastActive } from '@/utils/location-utils';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BarLocation {
    id: string | number;
    name: string;
    address: string;
    hours: string;
    logo: any;
    latitude: number;
    longitude: number;
}

interface FriendLocation {
    id: number;
    username: string;
    name: string;
    profile_pic_url?: string;
    user_locations: {
        latitude: number;
        longitude: number;
        updated_at: string;
    };
}

interface GroupLocation {
    bar: BarLocation;
    friends: FriendLocation[];
}

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
        borderRadius: 32, // Perfect circle for friends and groups
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

    // --- Group List Styles ---
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
        borderRadius: 20,
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

    // --- Button Styles ---
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
        backgroundColor: '#222', // Subtle dark color for dismiss
    }
});


// import React, { useEffect, useRef } from 'react';
// import { View, Text, Image, TouchableOpacity, Animated, PanResponder, Dimensions, StyleSheet } from 'react-native';
// import { Theme } from '@/constants/theme';
// import { formatLastActive } from '@/utils/location-utils';
// import { useRouter } from 'expo-router';
// const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// interface BarLocation {
//     id: string | number;
//     name: string;
//     address: string;
//     hours: string;
//     logo: any;
//     latitude: number;
//     longitude: number;
// }

// interface FriendLocation {
//     id: number;
//     username: string;
//     profile_pic_url?: string;
//     user_locations: {
//         latitude: number;
//         longitude: number;
//         updated_at: string;
//     };
// }

// interface GroupLocation {
//     bar: BarLocation;
//     friends: FriendLocation[];
// }

// interface Props {
//     location: BarLocation | FriendLocation | GroupLocation | null;
//     onClose: () => void;
//     onViewDetails: () => void;
// }

// export const MapBottomSheet = ({ location, onClose, onViewDetails }: Props) => {

//     const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
//     const router = useRouter();

//     // 1. Is it a single friend?
//     const isFriend = (loc: any): loc is FriendLocation => {
//         return !!loc && 'username' in loc && !('friends' in loc);
//     };

//     // 2. Is it a group of friends?
//     const isGroup = (loc: any): loc is GroupLocation => {
//         return !!loc && 'friends' in loc && Array.isArray(loc.friends);
//     };

//     // 3. Is it just a bar? (If it's not a friend and not a group, it's a bar)
//     const isBar = (loc: any): loc is BarLocation => {
//         return !!loc && 'name' in loc && !('username' in loc) && !('friends' in loc);
//     };

//     const title = isFriend(location)
//         ? location.username
//         : isGroup(location)
//             ? `${location.friends.length} Friends`
//             : location?.name;

//     const subtitle = isFriend(location)
//         ? `Active ${formatLastActive(location.user_locations?.updated_at)}`
//         : isGroup(location)
//             ? `at ${location.bar.name}`
//             : location?.hours;

//     const displayImage = isFriend(location)
//         ? { uri: location.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(location.username)}&background=7b61ff&color=fff` }
//         : isGroup(location)
//             ? location.bar.logo // Show the bar logo for a group
//             : location?.logo;

//     const panResponder = useRef(
//         PanResponder.create({
//             onStartShouldSetPanResponder: () => true,
//             onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10,
//             onPanResponderMove: (_, gesture) => { if (gesture.dy > 0) slideAnim.setValue(gesture.dy); },
//             onPanResponderRelease: (_, gesture) => {
//                 if (gesture.dy > 100 || gesture.vy > 0.5) onClose();
//                 else Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }).start();
//             },
//         })
//     ).current;

//     if (isGroup(location)) {
//         return (
//             <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
//                 <View style={styles.sheetContent}>
//                     <View style={styles.dragArea}><View style={styles.dragHandle} /></View>

//                     <Text style={styles.modalTitle}>
//                         {location.friends.length} Friends @ {location.bar.name}
//                     </Text>

//                     <View style={styles.friendListContainer}>
//                         {location.friends.map((f) => (
//                             <TouchableOpacity
//                                 key={f.id}
//                                 style={styles.friendListRow}
//                                 // This updates the parent's selectedLocation state to the single friend!
//                                 onPress={() => onViewDetails && setSelectedLocation(f)}
//                             >
//                                 <Image
//                                     source={{ uri: f.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(f.username)}` }}
//                                     style={styles.listAvatar}
//                                 />
//                                 <Text style={styles.modalBodyText}>{f.username}</Text>
//                                 <FontAwesome name="chevron-right" size={12} color="#666" />
//                             </TouchableOpacity>
//                         ))}
//                     </View>

//                     <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
//                         <Text style={styles.buttonText}>Dismiss</Text>
//                     </TouchableOpacity>
//                 </View>
//             </Animated.View>
//         );
//     }

//     useEffect(() => {
//         Animated.spring(slideAnim, {
//             toValue: location ? 0 : SCREEN_HEIGHT,
//             useNativeDriver: true,
//             tension: 50,
//             friction: 8,
//         }).start();
//     }, [location]);

//     if (!location) return null;

//     return (
//         <Animated.View
//             pointerEvents={location ? 'auto' : 'none'}
//             style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}
//         >
//             <View style={styles.sheetContent}>
//                 <View {...panResponder.panHandlers} style={styles.dragArea}>
//                     <View style={styles.dragHandle} />
//                 </View>

//                 <View style={styles.sheetHeader}>
//                     <Image
//                         source={displayImage}
//                         style={[styles.sheetLogo, isFriend(location) && styles.friendAvatar]}
//                     />
//                     <View style={styles.textContainer}>
//                         <Text style={styles.modalTitle} numberOfLines={1}>{title}</Text>
//                         <Text style={styles.modalBodyText}>{subtitle}</Text>
//                     </View>
//                 </View>

//                 {!isFriend(location) ? (
//                     <TouchableOpacity style={styles.button} onPress={onViewDetails}>
//                         <Text style={styles.buttonText}>View Bar Details</Text>
//                     </TouchableOpacity>
//                 ) : (
//                     <TouchableOpacity
//                         style={[styles.button, { backgroundColor: '#7b61ff' }]}
//                         onPress={() => {
//                             // Adjust the pathname to match your project's routing structure
//                             router.push({
//                                 pathname: "/account/[id]",
//                                 params: { id: String(location.id) }
//                             });
//                             onClose(); // Close the sheet after navigating
//                         }}
//                     >
//                         <Text style={styles.buttonText}>View {location.username}'s Profile</Text>
//                     </TouchableOpacity>
//                 )}

//                 <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
//                     <Text style={styles.buttonText}>Dismiss</Text>
//                 </TouchableOpacity>
//             </View>
//         </Animated.View>
//     );
// };

// const styles = StyleSheet.create({
//     bottomSheet: {
//         position: 'absolute',
//         bottom: 0,
//         left: 0,
//         right: 0,
//         backgroundColor: 'rgba(20, 20, 25, 0.98)',
//         borderTopLeftRadius: 24,
//         borderTopRightRadius: 24,
//         paddingHorizontal: 20,
//         // paddingBottom: 34,
//         paddingTop: 8,
//         elevation: 20,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: -4 },
//         shadowOpacity: 0.3,
//         shadowRadius: 8,
//     },
//     dragArea: {
//         width: '100%',
//         height: 32,
//         alignItems: 'center',
//         justifyContent: 'center'
//     },
//     dragHandle: {
//         width: 36,
//         height: 4,
//         backgroundColor: '#444',
//         borderRadius: 2
//     },
//     sheetHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 24,
//         marginTop: 10,
//         gap: 16
//     },
//     sheetLogo: {
//         width: 64,
//         height: 64,
//         borderRadius: 12,
//         borderWidth: 2,
//         borderColor: Theme.dark.primary
//     },
//     friendAvatar: {
//         borderRadius: 14,
//         borderColor: '#7b61ff', // Theme.dark.primary || '#7b61ff',
//     },
//     textContainer: {
//         flex: 1,
//     },
//     sheetContent: {
//         width: '100%',
//     },
//     modalTitle: {
//         fontSize: 22,
//         fontWeight: 'bold',
//         color: '#FFFFFF'
//     },
//     modalBodyText: {
//         fontSize: 15,
//         color: '#AAA',
//         marginTop: 2
//     },
//     button: {
//         backgroundColor: Theme.dark.primary,
//         borderRadius: 12,
//         paddingVertical: 14,
//         alignItems: 'center',
//         marginBottom: 10
//     },
//     buttonText: {
//         color: '#FFF',
//         fontSize: 16,
//         fontWeight: 'bold'
//     },
//     closeButton: {
//         backgroundColor: '#222',
//     },
//     friendListContainer: {
//         marginTop: 10,
//         maxHeight: 250, // Keep the list from growing too tall
//     },
//     friendListRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingVertical: 12,
//         paddingHorizontal: 8,
//         borderBottomWidth: 1,
//         borderBottomColor: 'rgba(255, 255, 255, 0.1)', // Subtle divider
//         gap: 12,
//     },
//     listAvatar: {
//         width: 40,
//         height: 40,
//         borderRadius: 20,
//         borderWidth: 1,
//         borderColor: '#7b61ff', // Matching your light purple theme
//     },
//     listTextContainer: {
//         flex: 1,
//     },
//     listName: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#FFFFFF',
//     },
//     listUsername: {
//         fontSize: 13,
//         color: '#AAAAAA',
//         marginTop: 1,
//     },
//     chevronIcon: {
//         opacity: 0.5,
//     },
//     smallSubtext: {
//         fontSize: 12,
//         color: '#888',
//         marginTop: 2,
//     },
// });