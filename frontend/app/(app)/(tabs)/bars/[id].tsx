import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';

const barDetails = [
    {
        id: '1',
        name: "Cy's Roost",
        description: "Lively College Bar",
        favorite: true,
        visits: 124,
        friends: 8,
        favorites: 56,
        events: ['Mugs Night - Thursday', 'DJ Set - Friday'],
        deals: ['$2 Wells until 11 PM', 'Half-off Tacos after 10 PM'],
        cover: require('../../../../assets/images/Logo.png'),
        image: require('../../../../assets/images/Logo.png'),
        mapLocation: require('../../../../assets/images/map.jpg'),
        galleryImage: require('../../../../assets/images/gallery.jpg'),
    },
    {
        id: '2',
        name: "Sips",
        description: "Nightclub and Lounge",
        favorite: false,
        visits: 89,
        friends: 3,
        favorites: 40,
        events: ['Trivia Night - Wednesday', 'Ladies Night - Saturday'],
        deals: ['Free Entry before 10 PM'],
        cover: require('../../../../assets/images/Logo.png'),
        image: require('../../../../assets/images/Logo.png'),
        mapLocation: require('../../../../assets/images/map.jpg'),
        galleryImage: require('../../../../assets/images/gallery.jpg'),
    },
    {
        id: '3',
        name: "Outlaws",
        description: "Live Music Venue",
        favorite: false,
        visits: 200,
        friends: 5,
        favorites: 70,
        events: ['Live Band - Saturday'],
        deals: ['$3 Beers', '$5 Margaritas'],
        cover: require('../../../../assets/images/Logo.png'),
        image: require('../../../../assets/images/Logo.png'),
        mapLocation: require('../../../../assets/images/map.jpg'),
        galleryImage: require('../../../../assets/images/gallery.jpg'),
    },
];

export default function BarProfile() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [bars, setbars] = useState(barDetails);
    const bar = bars.find((b) => b.id === id);

    if (!bar) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'white' }}>Bar not found.</Text>
            </View>
        );
    }

    const toggleFavorite = (id: string) => {
        const updated = bars.map((b) =>
            b.id === id ? { ...b, favorite: !b.favorite } : b
        );
        setbars(updated);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
            {/* Cover Photo */}
            <Image source={bar.cover} style={styles.coverPhoto} resizeMode="cover" />
            {/* Header */}
            <View style={styles.headerRow}>
                <Image source={bar.image} style={styles.barImage} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.barName}>{bar.name}</Text>
                    <Text style={styles.barDescription}>{bar.description}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleFavorite(bar.id)}>
                    <FontAwesome name="star" size={24} color={bar.favorite ? '#33CCFF' : 'grey'} />
                </TouchableOpacity>
            </View>
            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{bar.visits}</Text>
                    <Text style={styles.statLabel}>Visits This Month</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{bar.friends}</Text>
                    <Text style={styles.statLabel}>Your Friends</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{bar.favorites}</Text>
                    <Text style={styles.statLabel}>Favorites</Text>
                </View>
            </View>
            {/* Current Events */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Current Events</Text>
                {bar.events.map((event, index) => (
                    <Text key={index} style={styles.sectionItem}>
                        • {event}
                    </Text>
                ))}
            </View>
            {/* Deals */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Deals</Text>
                {bar.deals.map((deal, index) => (
                    <Text key={index} style={styles.sectionItem}>
                        • {deal}
                    </Text>
                ))}
            </View>
            <View style={styles.bottomRow}>
                {/* Map */}
                <TouchableOpacity
                    style={styles.bottomCard}
                    onPress={() => router.push('/map')}
                >
                    <View style={styles.bottomCardHeader}>
                        <Text style={styles.bottomCardTitle}>Map</Text>
                        <Text style={styles.bottomCardArrow}>{'>'}</Text>
                    </View>
                    <Image source={bar.mapLocation} style={styles.bottomCardImage} />
                </TouchableOpacity>
                {/* Gallery */}
                <TouchableOpacity
                    style={styles.bottomCard}
                    onPress={() => router.push('/gallery')}
                >
                    <View style={styles.bottomCardHeader}>
                        <Text style={styles.bottomCardTitle}>Gallery</Text>
                        <Text style={styles.bottomCardArrow}>{'>'}</Text>
                    </View>
                    <Image source={bar.galleryImage} style={styles.bottomCardImage} />
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b0b12',
    },
    coverPhoto: {
        width: '100%',
        height: 180,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    barImage: {
        width: 70,
        height: 70,
        borderRadius: 12,
        marginRight: 12,
    },
    barName: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    barDescription: {
        color: 'white',
        fontSize: 14,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        marginHorizontal: 12,
    },
    statBox: {
        alignItems: 'center',
    },
    statNumber: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        color: 'white',
        fontSize: 12,
    },
    sectionContainer: {
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 14,
        marginHorizontal: 12,
        marginVertical: 6,
    },
    sectionTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 6,
    },
    sectionItem: {
        color: '#E5E5E5',
        fontSize: 14,
        marginVertical: 2,
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        margin: 12,
    },
    bottomCard: {
        flex: 1,
        borderRadius: 12,
        marginHorizontal: 4,
        padding: 8,
    },
    bottomCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    bottomCardTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    bottomCardArrow: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
    },
    bottomCardImage: {
        width: '100%',
        height: 100,
        borderRadius: 8,
    },
});
