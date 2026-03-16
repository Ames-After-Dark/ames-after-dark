import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, PanResponder, Dimensions, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { formatLastActive } from '@/utils/location-utils';
import { useRouter } from 'expo-router';
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
    profile_pic_url?: string;
    user_locations: {
        latitude: number;
        longitude: number;
        updated_at: string;
    };
}

// 2. Update the Props to accept either one
interface Props {
    location: BarLocation | FriendLocation | null;
    onClose: () => void;
    onViewDetails: () => void;
}

// interface Props {
//     location: Location | null; // Can be a Bar or a Friend
//     onClose: () => void;
//     onViewDetails: () => void;
// }

export const MapBottomSheet = ({ location, onClose, onViewDetails }: Props) => {

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const router = useRouter();

    // Determine if the selected item is a Friend or a Bar
    // const isFriend = location && 'username' in location;

    // Dynamic content extraction
    // const title = isFriend ? location.username : location?.name;

    // 1. Create a Type Guard to safely check if it's a Friend
    const isFriend = (loc: any): loc is FriendLocation => {
        return loc && 'username' in loc;
    };

    // 1. Correct the usage in your variables
    const title = isFriend(location) ? location.username : location?.name;

    const subtitle = isFriend(location)
        ? `Active ${formatLastActive(location.user_locations?.updated_at)}`
        : location?.hours;

    const displayImage = isFriend(location)
        ? { uri: location.profile_pic_url || `https://ui-avatars.com/api/?name=${location.username}&background=7b61ff&color=fff` }
        : location?.logo;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
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
                <View {...panResponder.panHandlers} style={styles.dragArea}>
                    <View style={styles.dragHandle} />
                </View>

                <View style={styles.sheetHeader}>
                    <Image
                        source={displayImage}
                        style={[styles.sheetLogo, isFriend(location) && styles.friendAvatar]}
                    />
                    <View style={styles.textContainer}>
                        <Text style={styles.modalTitle} numberOfLines={1}>{title}</Text>
                        <Text style={styles.modalBodyText}>{subtitle}</Text>
                    </View>
                </View>

                {/* Only show "View Full Details" for bars, maybe a "View Profile" for friends later */}
                {/* Fixed Logic in MapBottomSheet.tsx */}
                {!isFriend(location) ? (
                    <TouchableOpacity style={styles.button} onPress={onViewDetails}>
                        <Text style={styles.buttonText}>View Bar Details</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: '#7b61ff' }]}
                        onPress={() => {
                            // Adjust the pathname to match your project's routing structure
                            router.push({
                                pathname: "/account/[id]",
                                params: { id: String(location.id) }
                            });
                            onClose(); // Close the sheet after navigating
                        }}
                    >
                        <Text style={styles.buttonText}>View {location.username}'s Profile</Text>
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
        backgroundColor: 'rgba(20, 20, 25, 0.98)', // Slightly darker/more opaque for Ames After Dark vibe
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingBottom: 34, // Extra padding for iOS home indicator
        paddingTop: 8,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    dragArea: {
        width: '100%',
        height: 32,
        alignItems: 'center',
        justifyContent: 'center'
    },
    dragHandle: {
        width: 36,
        height: 4,
        backgroundColor: '#444',
        borderRadius: 2
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
        gap: 16
    },
    sheetLogo: {
        width: 64,
        height: 64,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Theme.dark.primary
    },
    friendAvatar: {
        borderRadius: 32, // Circular for friends
        borderColor: '#7b61ff', // Theme.dark.primary || '#7b61ff',
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
        color: '#FFFFFF'
    },
    modalBodyText: {
        fontSize: 15,
        color: '#AAA',
        marginTop: 2
    },
    button: {
        backgroundColor: Theme.dark.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 10
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    closeButton: {
        backgroundColor: '#222', // Subtle dismiss button
    },
});

// import React, { useEffect, useRef } from 'react';
// import { View, Text, Image, TouchableOpacity, Animated, PanResponder, Dimensions, StyleSheet } from 'react-native';
// import { type Location } from '@/services/locationService';
// import { Theme } from '@/constants/theme';

// const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// interface Props {
//     location: Location | null;
//     onClose: () => void;
//     onViewDetails: () => void;
// }

// export const MapBottomSheet = ({ location, onClose, onViewDetails }: Props) => {
//     const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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

//     useEffect(() => {
//         Animated.spring(slideAnim, {
//             toValue: location ? 0 : SCREEN_HEIGHT,
//             useNativeDriver: true,
//             tension: 50,
//             friction: 8,
//         }).start();
//     }, [location]);

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
//                     <Image source={location?.logo} style={styles.sheetLogo} />
//                     <View>
//                         <Text style={styles.modalTitle}>{location?.name}</Text>
//                         <Text style={styles.modalBodyText}>{location?.hours}</Text>
//                     </View>
//                 </View>
//                 <TouchableOpacity style={styles.button} onPress={onViewDetails}>
//                     <Text style={styles.buttonText}>View Full Details</Text>
//                 </TouchableOpacity>
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
//         backgroundColor: 'rgba(0, 0, 0, 0.9)',
//         borderTopLeftRadius: 20,
//         borderTopRightRadius: 20,
//         paddingHorizontal: 20,
//         paddingBottom: 20,
//         paddingTop: 10,
//         elevation: 20
//     },
//     dragArea: {
//         width: '100%',
//         height: 30,
//         alignItems: 'center',
//         justifyContent: 'center'
//     },
//     dragHandle: {
//         width: 40,
//         height: 5,
//         backgroundColor: Theme.search.inactiveInput,
//         borderRadius: 3
//     },
//     sheetHeader: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 20,
//         gap: 15
//     },
//     sheetLogo: {
//         width: 60,
//         height: 60,
//         borderRadius: 16,
//         borderWidth: 2,
//         borderColor: Theme.dark.primary
//     },
//     sheetContent: {
//         width: '100%',
//     },
//     modalTitle: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         color: Theme.container.titleText
//     },
//     modalBodyText: {
//         fontSize: 14,
//         color: Theme.container.inactiveText
//     },
//     button: {
//         backgroundColor: Theme.dark.primary,
//         borderRadius: 8,
//         paddingVertical: 12,
//         alignItems: 'center',
//         marginBottom: 10
//     },
//     buttonText: {
//         color: Theme.container.titleText,
//         fontSize: 16,
//         fontWeight: 'bold'
//     },
//     closeButton: {
//         backgroundColor: Theme.dark.error
//     },
// });