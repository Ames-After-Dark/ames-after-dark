import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Theme } from '@/constants/theme';
import { formatPrice } from '@/utils/menu-helpers';

interface MenuItemProps {
    item: any;
    isLast: boolean;
    onPress: (item: any) => void;
}

export const MenuItem = ({ item, isLast, onPress }: MenuItemProps) => (
    <>
        <Pressable
            onPress={() => item.desc && onPress(item)}
            style={({ pressed }) => [
                styles.itemPressable,
                pressed && item.desc ? styles.itemPressed : null
            ]}
        >
            <View style={styles.itemRow}>
                <View style={styles.itemHeaderRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.price ? (
                        <Text style={[
                            styles.itemPrice,
                            !item.isAvailable && styles.itemPriceUnavailable
                        ]}>
                            {formatPrice(item.price)}
                        </Text>
                    ) : null}
                </View>
            </View>
        </Pressable>
        {!isLast && <View style={styles.itemDivider} />}
    </>
);

export const MenuSection = ({ section, onSelectItem }: { section: any, onSelectItem: (item: any) => void }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.items.map((item: any, index: number) => (
            <MenuItem
                key={item.id}
                item={item}
                isLast={index === section.items.length - 1}
                onPress={onSelectItem}
            />
        ))}
    </View>
);

export const MenuItemModal = ({ item, onClose }: { item: any, onClose: () => void }) => (
    <Modal transparent visible={Boolean(item)} animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.modalBackdrop} onPress={onClose}>
            <Pressable style={styles.modalCard} onPress={() => { }}>
                <Text style={styles.modalTitle}>{item?.name}</Text>
                <Text style={styles.modalDesc}>{item?.desc}</Text>
                <Pressable style={styles.modalClose} onPress={onClose}>
                    <Text style={styles.modalCloseText}>Close</Text>
                </Pressable>
            </Pressable>
        </Pressable>
    </Modal>
);

const styles = StyleSheet.create({
    section: {
        backgroundColor: Theme.container.background,
        borderRadius: 12,
        padding: 12,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    sectionTitle: {
        color: Theme.container.titleText,
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 6,
    },
    itemRow: {
        flexDirection: "column",
        paddingVertical: 8,
        gap: 4
    },
    itemPressable: {
        borderRadius: 8
    },
    itemPressed: {
        opacity: 0.7
    },
    itemHeaderRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8
    },
    itemDivider: {
        height: 1,
        backgroundColor: Theme.container.mainBorder
    },
    itemName: {
        color: Theme.container.titleText,
        fontSize: 16,
        fontWeight: "600"
    },
    itemPrice: {
        color: Theme.dark.secondary,
        fontWeight: "700",
        fontSize: 14,
        marginLeft: "auto",
        textAlign: "right"
    },
    itemPriceUnavailable: {
        color: Theme.container.inactiveText
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24
    },
    modalCard: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: Theme.container.background,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder
    },
    modalTitle: {
        color: Theme.container.titleText,
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 8
    },
    modalDesc: {
        color: Theme.search.input,
        fontSize: 14,
        lineHeight: 20
    },
    modalClose: {
        marginTop: 16,
        alignSelf: "flex-end",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: Theme.dark.primary
    },
    modalCloseText: {
        color: Theme.dark.white,
        fontWeight: "700"
    },
});