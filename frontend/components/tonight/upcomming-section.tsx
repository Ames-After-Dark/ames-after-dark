import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";
import { getLogoAssetForLocationName } from "@/utils/locationLogos";

interface UpcomingSectionProps {
    data: {
        label?: string | null;
        groups: any[];
    };
    onBarPress: (id: string) => void;
}

export default function UpcomingSection({ data, onBarPress }: UpcomingSectionProps) {
    if (!data.groups.length) {
        return (
            <View style={styles.stateContainer}>
                <View style={styles.iconCircle}>
                    <Ionicons name="calendar-outline" size={40} color={Theme.dark.primary} />
                </View>
                <Text style={styles.comingSoonHeader}>
                    No matching upcoming events found.
                </Text>
                <Text style={styles.emptyText}>
                    Try a different search term or clear the filter.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.cardsList}>
            {!data.label?.trim() && <View style={styles.sectionSpacer} />}
            {!!data.label?.trim() && <Text style={styles.upcomingTitle}>{data.label}</Text>}
            {data.groups.map((group) => (
                <View key={group.key} style={styles.upcomingGroup}>
                    <Text style={styles.upcomingDayHeader}>{group.label}</Text>
                    {group.items.map((item: any) => (
                        <Pressable key={item.id}
                            style={[styles.card, item.isActiveNow && styles.cardActive]}
                            onPress={() => onBarPress(item.barId)}>
                            <Image
                                source={getLogoAssetForLocationName(item.bar)}
                                style={styles.cardImg}
                            />
                            <View style={{ flex: 1, justifyContent: "center" }}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <Text style={styles.cardSubtitle}>{item.bar}</Text>
                                <Text style={styles.cardDetail}>{item.whenLabel}</Text>
                                {!!item.subtitle && <Text style={styles.cardDetail}>{item.subtitle}</Text>}
                            </View>
                            <View style={styles.rightContainer}>
                                <View style={[styles.statusPill, { backgroundColor: item.kind === "Deal" ? Theme.dark.primary : Theme.dark.secondary }]}>
                                    <Text style={styles.statusPillText}>{item.kind}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={Theme.search.inactiveInput} />
                            </View>
                        </Pressable>
                    ))}
                </View>
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
    cardsList: {
        paddingHorizontal: 16,
        paddingTop: 0,
        paddingBottom: 92,
        gap: 8,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        backgroundColor: Theme.container.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Theme.container.secondaryBorder,
    },
    cardActive: {
        borderColor: Theme.dark.primary,
        borderWidth: 2,
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
    upcomingTitle: {
        color: Theme.container.titleText,
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 4,
    },
    sectionSpacer: {
        height: 4,
    },
    upcomingGroup: {
        gap: 12
    },
    upcomingDayHeader: {
        color: Theme.container.inactiveText,
        fontSize: 12,
        fontWeight: "700",
        marginTop: 2
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