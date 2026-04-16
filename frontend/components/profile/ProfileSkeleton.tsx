import { Theme } from "@/constants/theme";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SkeletonItem = ({ style }: { style: any }) => (
    <View style={[style, { backgroundColor: '#1C1C26', overflow: 'hidden' }]} />
);

export const ProfileSkeleton = () => {
    const insets = useSafeAreaInsets();

    return (
        <View style={skeletonStyles.container}>
            <ScrollView
                contentContainerStyle={[skeletonStyles.scrollContent, { paddingTop: insets.top + 56 }]}
                showsVerticalScrollIndicator={false}
            >

                {/* 1. Header: Logo, Name, Username */}
                <View style={{ alignItems: 'flex-start', marginBottom: 25 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <SkeletonItem style={skeletonStyles.logoSquare} />
                        <View style={{ marginLeft: 15 }}>
                            <SkeletonItem style={skeletonStyles.nameLine} />
                            <SkeletonItem style={skeletonStyles.usernameLine} />
                        </View>
                    </View>
                </View>

                {/* 2. Stats: Two equal boxes (Friends | Pending/Mutual) */}
                <View style={skeletonStyles.statsRow}>
                    <SkeletonItem style={skeletonStyles.statBox} />
                    <SkeletonItem style={skeletonStyles.statBox} />
                </View>

                {/* 3. Bio Bar */}
                <SkeletonItem style={skeletonStyles.bioBar} />

                {/* 4. Feature Cards: Drinks & Streaks */}
                <View style={skeletonStyles.statsRow}>
                    <SkeletonItem style={skeletonStyles.featureCardSmall} />
                    <SkeletonItem style={skeletonStyles.featureCardSmall} />
                </View>

                {/* 5. Large "Fav Bar" Card */}
                <SkeletonItem style={skeletonStyles.featureCardLarge} />

                {/* 6. The bottom Action Button space */}
                <SkeletonItem style={skeletonStyles.actionButtonPlaceholder} />

            </ScrollView>
        </View>
    );
};

const skeletonStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.dark.background
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        gap: 15
    },
    logoSquare: {
        width: 80,
        height: 80,
        borderRadius: 16
    },
    nameLine: {
        width: 120,
        height: 24,
        borderRadius: 6
    },
    usernameLine: {
        width: 160,
        height: 16,
        borderRadius: 4,
        marginTop: 8
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12
    },
    statBox: {
        flex: 1,
        height: 90,
        borderRadius: 20
    },
    bioBar: {
        width: '100%',
        height: 50,
        borderRadius: 12
    },
    featureCardSmall: {
        flex: 1,
        height: 140,
        borderRadius: 20
    },
    featureCardLarge: {
        width: '100%',
        height: 180,
        borderRadius: 20
    },
    actionButtonPlaceholder: {
        width: '100%',
        height: 55,
        borderRadius: 28,
        marginTop: 10
    }
});