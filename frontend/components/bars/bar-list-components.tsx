import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from '@/constants/theme';
import { Bar } from '@/types/bars';
import { getBarLogoSource } from "@/utils/bar-assets";

interface BarCardProps {
    item: Bar & { __openNow?: boolean };
    isFav: boolean;
    onToggleFav: (id: string) => void;
    onPress: (id: string) => void;
}

export const BarCard = ({ item, isFav, onToggleFav, onPress }: BarCardProps) => {
    const logoSource = getBarLogoSource(item);
    const firstDeal = item.dealsScheduled?.[0]?.title ?? item.eventsScheduled?.[0]?.name ?? "No specials tonight";
    const openNow = !!item.__openNow;
    const statusDetail = openNow
        ? (item.closingTime ? `Closes at ${item.closingTime}` : "Open now")
        : (item.openingTime ? `Opens at ${item.openingTime}` : "Closed now");

    return (
        <TouchableOpacity onPress={() => onPress(String(item.id))}>
            <View style={styles.barCard}>
                <Image source={logoSource} style={styles.barImage} resizeMode="cover" />
                <View style={styles.barInfo}>
                    <Text style={styles.barName}>{item.name}</Text>
                    <Text style={styles.barStatus}>{statusDetail}</Text>
                    <Text style={styles.barSpecials}>{firstDeal}</Text>
                </View>
                <View style={styles.rightContainer}>
                    <View style={styles.actionsRow}>
                        <TouchableOpacity onPress={() => onToggleFav(String(item.id))} style={styles.favoriteButton}>
                            <FontAwesome
                                name={isFav ? "star" : "star-o"}
                                size={20}
                                color={isFav ? Theme.dark.tertiary : Theme.dark.secondary}
                            />
                        </TouchableOpacity>
                        <Ionicons name="chevron-forward" size={19} color={Theme.search.inactiveInput} />
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export const FilterTab = ({ label, isActive, onPress }: { label: string, isActive: boolean, onPress: () => void }) => (
    <TouchableOpacity
        style={[styles.filterButton, isActive && styles.activeFilter]}
        onPress={onPress}
    >
        <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
            {label}
        </Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    barCard: {
        flexDirection: "row",
        backgroundColor: Theme.container.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Theme.container.secondaryBorder,
        paddingHorizontal: 14,
        paddingVertical: 13,
        marginVertical: 7,
        alignItems: "center",
        gap: 14,
    },
    barImage: {
        width: 62,
        height: 62,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Theme.container.secondaryBorder,
    },
    barInfo: {
        flex: 1
    },
    barName: {
        color: Theme.container.titleText,
        fontSize: 17,
        fontWeight: "800"
    },
    barStatus: {
        color: Theme.container.inactiveText,
        marginTop: 3,
        fontSize: 14,
    },
    barSpecials: {
        color: Theme.container.inactiveText,
        marginTop: 3,
        fontSize: 13,
    },
    rightContainer: {
        alignItems: "flex-end",
        justifyContent: "center",
        minWidth: 52,
    },
    actionsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    favoriteButton: {
        padding: 1,
    },
    filterButton: {
        borderColor: Theme.container.inactiveBorder,
        borderWidth: 2,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 12,
        marginHorizontal: 6,
    },
    activeFilter: {
        borderColor: Theme.dark.primary
    },
    filterText: {
        color: Theme.container.inactiveText,
        fontSize: 12,
        fontWeight: "700"
    },
    filterTextActive: {
        color: Theme.container.activeText,
        fontWeight: "800"
    },
});