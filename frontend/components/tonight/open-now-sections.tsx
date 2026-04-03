import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";
import { getLogoAssetForLocationName } from "@/utils/locationLogos";

export default function OpenNowSection({ data, onBarPress }: { data: any[], onBarPress: (id: string) => void }) {
    if (!data.length) {
        return (
            <View style={styles.stateContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="time-outline" size={40} color={Theme.dark.primary} />
                </View>
                <Text style={styles.comingSoonHeader}>
                    No matching locations currently open.
                </Text>
                <Text style={styles.emptyText}>
                    Try a different search term or clear the filter.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.cardsList}>
            {data.map((item) => (
                <Pressable key={item.id} style={styles.card} onPress={() => onBarPress(item.id)}>
                    <Image source={getLogoAssetForLocationName(item.bar)} style={styles.cardImg} />
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.cardTitle}>{item.bar}</Text>
                        {!!item.event && <Text style={styles.cardSubtitle}>{item.event}</Text>}
                        {!!item.openHours && <Text style={styles.cardDetail}>Hours: {item.openHours}</Text>}
                    </View>
                    <View style={styles.rightContainer}>
                        <View style={[styles.statusPill, { backgroundColor: item.isOpen ? Theme.dark.success : "#6b7280" }]}>
                            <Text style={styles.statusPillText}>{item.isOpen ? "Open" : "Closed"}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Theme.search.inactiveInput} />
                    </View>
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    stateContainer: {
        paddingHorizontal: 16,
        paddingTop: 28,
        paddingBottom: 92,
        alignItems: "center",
        justifyContent: "center",
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Theme.search.background,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Theme.container.secondaryBorder,
    },
    comingSoonHeader: {
        color: Theme.container.titleText,
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8,
        textAlign: "center",
    },
    cardsList: { padding: 16, gap: 12, paddingBottom: 92 },
    card: {
        flexDirection: "row", alignItems: "center", gap: 12, padding: 12,
        backgroundColor: Theme.container.background, borderRadius: 14, borderWidth: 1, borderColor: Theme.container.secondaryBorder,
    },
    cardImg: {
        width: 48,
        height: 48,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Theme.container.secondaryBorder
    },
    cardTitle: {
        color: Theme.container.titleText,
        fontWeight: "800",
        fontSize: 14
    },
    cardSubtitle: {
        color: Theme.container.inactiveText,
        marginTop: 2,
        fontSize: 13
    },
    cardDetail: {
        color: Theme.container.inactiveText,
        marginTop: 2,
        fontSize: 12
    },
    rightContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    statusPill: {
        width: 60,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 4,
        borderRadius: 999
    },
    statusPillText: {
        color: "#0b0c12",
        fontSize: 10,
        fontWeight: "800",
        textAlign: "center"
    },
    emptyText: {
        color: Theme.container.inactiveText,
        textAlign: "center",
        marginTop: 8,
        fontSize: 13
    },
});