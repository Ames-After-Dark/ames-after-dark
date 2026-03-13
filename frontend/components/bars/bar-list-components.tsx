import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from "@expo/vector-icons";
import { Theme } from '@/constants/theme';
import { Bar } from '@/types/bars';
import { getBarImageSource, getBarLogoSource } from "@/utils/bar-assets";

interface BarCardProps {
    item: Bar & { __openNow?: boolean };
    isFav: boolean;
    onToggleFav: (id: string) => void;
    onPress: (id: string) => void;
}

export const BarCard = ({ item, isFav, onToggleFav, onPress }: BarCardProps) => {
    // const imageSource = getBarImageSource(item);
    const logoSource = getBarLogoSource(item);
    const firstDeal = item.dealsScheduled?.[0]?.title ?? item.eventsScheduled?.[0]?.name ?? "No specials tonight";
    const openNow = !!item.__openNow;

    return (
        <TouchableOpacity onPress={() => onPress(String(item.id))}>
            <View style={styles.barCard}>
                <Image source={logoSource} style={styles.barImage} resizeMode="cover" />
                <View style={styles.barInfo}>
                    <Text style={styles.barName}>{item.name}</Text>
                    <Text style={styles.barStatus}>
                        {openNow ? `Open - Until ${item.closingTime ?? ""}` : "Closed"}
                    </Text>
                    <Text style={styles.barSpecials}>{firstDeal}</Text>
                </View>
                <TouchableOpacity onPress={() => onToggleFav(String(item.id))}>
                    <FontAwesome
                        name="star"
                        size={22}
                        color={isFav ? Theme.dark.tertiary : Theme.container.inactiveText}
                    />
                </TouchableOpacity>
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
        borderRadius: 16,
        padding: 12,
        marginVertical: 6,
        alignItems: "center"
    },
    barImage: {
        width: 70,
        height: 70,
        borderRadius: 12,
        marginRight: 12
    },
    barInfo: {
        flex: 1
    },
    barName: {
        color: Theme.container.titleText,
        fontSize: 18,
        fontWeight: "600"
    },
    barStatus: {
        color: Theme.container.titleText,
        fontSize: 14,
        fontWeight: "500"
    },
    barSpecials: {
        color: Theme.container.titleText,
        fontSize: 14,
        marginVertical: 2
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