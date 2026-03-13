import { Pressable, Image, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";
import { getLogoAssetForLocationName } from "@/utils/locationLogos";

interface BarCardProps {
    title: string;
    subtitle?: string;
    detail?: string;
    barName: string;
    onPress: () => void;
    statusLabel?: string;
    statusColor?: string;
}

export const BarCard = ({ title, subtitle, detail, barName, onPress, statusLabel, statusColor }: BarCardProps) => (
    <Pressable style={styles.card} onPress={onPress}>
        <Image source={getLogoAssetForLocationName(barName)} style={styles.cardImg} />
        <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
            {detail && <Text style={styles.cardDetail}>{detail}</Text>}
        </View>
        <View style={styles.rightContainer}>
            {statusLabel && (
                <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
                    <Text style={styles.statusPillText}>{statusLabel}</Text>
                </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={Theme.search.inactiveInput} />
        </View>
    </Pressable>
);

const styles = StyleSheet.create({
    rightContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        backgroundColor: Theme.container.background, // "#0f172a",
        borderRadius: 14,
        borderWidth: 1,
        // borderColor: "#1f2937",
        borderColor: Theme.container.secondaryBorder,
    },
    cardDealsVariant: {
        borderColor: Theme.container.secondaryBorder, // "#164e63",
        backgroundColor: Theme.container.background, // "#0b1420"
    },
    cardImg: {
        width: 48,
        height: 48,
        borderRadius: 10,
        borderWidth: 1,
        // borderColor: Theme.container.mainBorder, // "#1f2937",
        borderColor: Theme.container.secondaryBorder,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    cardTitle: {
        color: Theme.container.titleText, // "#f1f5f9",
        fontWeight: "800",
        fontSize: 14,
    },
    cardSubtitle: {
        color: Theme.container.inactiveText, // "#cbd5e1",
        marginTop: 2,
        fontSize: 13,
    },
    cardDetail: {
        color: Theme.container.inactiveText, // "#94a3b8",
        marginTop: 2,
        fontSize: 12,
    },
    statusPill: {
        width: 60,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 0,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: "flex-start",
    },
    statusPillText: {
        color: "#0b0c12",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.4,
        textAlign: "center",
    },
});