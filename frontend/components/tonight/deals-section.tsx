import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";
import { getLogoAssetForLocationName } from "@/utils/locationLogos";

interface DealsSectionProps {
  data: any[];
  onBarPress: (id: string) => void;
}

export default function DealsSection({ data, onBarPress }: DealsSectionProps) {
  return (
    <View style={styles.cardsList}>
      {data.map((item) => (
        <Pressable
          key={item.id}
          style={styles.card}
          onPress={() => onBarPress(item.barId)}
        >
          <Image
            source={getLogoAssetForLocationName(item.bar)}
            style={styles.cardImg}
            resizeMode="cover"
          />
          <View style={{ flex: 1, justifyContent: "center" }}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.bar}</Text>
            {!!item.subtitle && (
              <Text style={styles.cardDetail}>{item.subtitle}</Text>
            )}
          </View>
          <View style={styles.rightContainer}>
            <View style={[styles.statusPill, { backgroundColor: Theme.dark.primary }]}>
              <Text style={styles.statusPillText}>Deal</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Theme.search.inactiveInput} />
          </View>
        </Pressable>
      ))}
      {!data.length && <Text style={styles.emptyText}>No deals available tonight.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  cardsList: { 
    padding: 16, 
    gap: 12, 
    paddingBottom: 92 
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
    marginTop: 24, 
    fontSize: 13 
  },
});