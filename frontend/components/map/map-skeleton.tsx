import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Theme } from '@/constants/theme';

export const MapSkeleton = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <Animated.View style={[styles.skeletonMap, { opacity }]} />
            </View>
            <View style={styles.skeletonSheet}>
                <View style={styles.dragHandle} />
                <View style={styles.sheetHeader}>
                    <Animated.View style={[styles.skeletonCircle, { opacity }]} />
                    <View style={{ gap: 8 }}>
                        <Animated.View style={[styles.skeletonLine, { width: 150, opacity }]} />
                        <Animated.View style={[styles.skeletonLine, { width: 100, opacity }]} />
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: Theme.dark.background 
    },
    mapContainer: { 
        flex: 1, 
        borderRadius: 8, 
        overflow: 'hidden', 
        marginTop: 16, 
        marginHorizontal: 16 
    },
    skeletonMap: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: '#2C2C2C' 
    },
    skeletonSheet: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: 200, 
        backgroundColor: '#1A1A1A', 
        borderTopLeftRadius: 20, 
        borderTopRightRadius: 20, 
        padding: 20 
    },
    dragHandle: { 
        width: 40, 
        height: 5, 
        backgroundColor: '#333', 
        borderRadius: 3, 
        alignSelf: 'center', 
        marginBottom: 15 
    },
    sheetHeader: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 15 
    },
    skeletonCircle: { 
        width: 60, 
        height: 60, 
        borderRadius: 30, 
        backgroundColor: '#333' 
    },
    skeletonLine: { 
        height: 15, 
        borderRadius: 4, 
        backgroundColor: '#333' 
    },
});