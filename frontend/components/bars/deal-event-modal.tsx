// components/bars/deal-event-modal.tsx
// Shared modal + pill for deal/event detail popups.
// Used by both the Tonight tab and the Bar detail page.

import React from "react";
import { View, Text, Image, Pressable, Modal, StyleSheet } from "react-native";
import { Theme } from "@/constants/theme";
import { getLogoAssetForLocationName } from "@/utils/locationLogos";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DealOrEventItem = {
  id: string;
  kind: "deal" | "event";
  title: string;
  /** Optional description / subtitle shown in the modal body */
  subtitle?: string;
  /** Optional start time for display */
  startTime?: string; // display string e.g. "9:00 PM"
};

// ─── Pill ─────────────────────────────────────────────────────────────────────

export function DealEventPill({ kind }: { kind: "event" | "deal" }) {
  const isEvent = kind === "event";
  return (
    <View
      style={[
        pillStyles.pill,
        { backgroundColor: isEvent ? Theme.dark.secondary : Theme.dark.primary },
      ]}
    >
      <Text style={pillStyles.pillText}>{isEvent ? "Event" : "Deal"}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    width: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    color: "#0b0c12",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },
});

// ─── Modal ────────────────────────────────────────────────────────────────────

interface DealEventModalProps {
  item: DealOrEventItem | null;
  barName: string;
  barId: string;
  onClose: () => void;
  /** Optional — if omitted the "View Details" button is hidden (e.g. already on bar page) */
  onBarPress?: (id: string) => void;
}

export function DealEventModal({
  item,
  barName,
  barId,
  onClose,
  onBarPress,
}: DealEventModalProps) {
  return (
    <Modal
      visible={item !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={modalStyles.backdrop} onPress={onClose}>
        <Pressable style={modalStyles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Logo + bar name row */}
          <View style={modalStyles.header}>
            <Image
              source={getLogoAssetForLocationName(barName)}
              style={modalStyles.logo}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.barName}>{barName}</Text>
              {item?.startTime ? (
                <Text style={modalStyles.time}>{item.startTime}</Text>
              ) : null}
            </View>
            {item && <DealEventPill kind={item.kind} />}
          </View>

          {/* Title */}
          <Text style={modalStyles.title}>{item?.title}</Text>

          {/* Description */}
          {item?.subtitle ? (
            <Text style={modalStyles.description}>{item.subtitle}</Text>
          ) : (
            <Text style={modalStyles.descriptionEmpty}>No description available.</Text>
          )}

          {/* Actions */}
          <View style={modalStyles.actions}>
            {onBarPress && (
              <Pressable
                style={modalStyles.detailsButton}
                onPress={() => {
                  onClose();
                  onBarPress(barId);
                }}
              >
                <Text style={modalStyles.detailsButtonText}>
                  View {barName} Details
                </Text>
              </Pressable>
            )}
            <Pressable style={modalStyles.closeButton} onPress={onClose}>
              <Text style={modalStyles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  sheet: {
    backgroundColor: Theme.container.background,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 20,
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
  },
  barName: {
    color: Theme.container.titleText,
    fontSize: 14,
    fontWeight: "700",
  },
  time: {
    color: Theme.container.inactiveText,
    fontSize: 13,
    marginTop: 2,
  },
  title: {
    color: Theme.container.titleText,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
  },
  description: {
    color: Theme.container.inactiveText,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  descriptionEmpty: {
    color: Theme.container.inactiveBorder,
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  detailsButton: {
    flex: 1,
    backgroundColor: Theme.dark.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  detailsButtonText: {
    color: Theme.dark.white,
    fontWeight: "800",
    fontSize: 13,
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
    backgroundColor: Theme.search.background,
  },
  closeButtonText: {
    color: Theme.container.titleText,
    fontWeight: "700",
    fontSize: 13,
  },
});
