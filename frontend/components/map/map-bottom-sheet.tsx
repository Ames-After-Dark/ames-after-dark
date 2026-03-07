import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, PanResponder, Dimensions, StyleSheet } from 'react-native';
import { type Location } from '@/services/locationService';
import { Theme } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    location: Location | null;
    onClose: () => void;
    onViewDetails: () => void;
}

export const MapBottomSheet = ({ location, onClose, onViewDetails }: Props) => {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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
                    <Image source={location?.logo} style={styles.sheetLogo} />
                    <View>
                        <Text style={styles.modalTitle}>{location?.name}</Text>
                        <Text style={styles.modalBodyText}>{location?.hours}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.button} onPress={onViewDetails}>
                    <Text style={styles.buttonText}>View Full Details</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.closeButton]} onPress={onClose}>
                    <Text style={styles.buttonText}>Dismiss</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 20, paddingTop: 10, elevation: 20 },
    dragArea: { width: '100%', height: 30, alignItems: 'center', justifyContent: 'center' },
    dragHandle: { width: 40, height: 5, backgroundColor: Theme.search.inactiveInput, borderRadius: 3 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
    sheetLogo: { width: 60, height: 60, borderRadius: 16, borderWidth: 2, borderColor: Theme.dark.primary },
    sheetContent: {
        width: '100%',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: Theme.container.titleText },
    modalBodyText: { fontSize: 14, color: Theme.container.inactiveText },
    button: { backgroundColor: Theme.dark.primary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 10 },
    buttonText: { color: Theme.container.titleText, fontSize: 16, fontWeight: 'bold' },
    closeButton: { backgroundColor: Theme.dark.error },
});