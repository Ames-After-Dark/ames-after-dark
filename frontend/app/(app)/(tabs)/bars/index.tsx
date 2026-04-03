import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl, NativeSyntheticEvent, NativeScrollEvent, Animated } from "react-native";
import { useNavigation, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import { useBars } from "@/hooks/useBars";
import { shouldForceErrorPage } from "@/utils/dev-error-pages";
import ErrorState from "@/components/ui/error-state";
import { Theme } from '@/constants/theme';

import { BarCard, FilterTab } from "@/components/bars/bar-list-components";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from '@/context/FavoritesContext';
import { useFocusEffect } from '@react-navigation/native';
import { useTopHeaderVisibility } from '@/context/top-header-visibility';

export default function Bars() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { topHeaderVisible, setTopHeaderVisible } = useTopHeaderVisibility();
  const { isFavorited, toggleFavorite } = useFavorites();

  // Constants
  const HEADER_HEIGHT = 60 + insets.top;
  const SEARCH_CONTAINER_HEIGHT = 110;
  const TOTAL_TOP_SPACING = HEADER_HEIGHT + SEARCH_CONTAINER_HEIGHT;

  // State
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { bars, loading, error, refetch } = useBars({ q: search || undefined });

  // Refs for Scroll Logic
  const lastScrollYRef = useRef(0);
  const headerVisibleRef = useRef(true);
  const lastHeaderToggleTsRef = useRef(0);
  const listRef = useRef<FlatList>(null);

  const searchBarTop = useRef(new Animated.Value(HEADER_HEIGHT)).current;

  // Animate header position when visibility changes
  useEffect(() => {
    Animated.timing(searchBarTop, {
      toValue: topHeaderVisible ? HEADER_HEIGHT : insets.top,
      duration: 250,
      useNativeDriver: false, // top/height don't support native driver
    }).start();
  }, [topHeaderVisible, HEADER_HEIGHT, insets.top]);

  // Whenever filter or search changes, scroll back to the top
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, [filter, search]);

  useFocusEffect(
    useCallback(() => {
      setTopHeaderVisible(true);
      headerVisibleRef.current = true;
    }, [setTopHeaderVisible])
  );

  const setHeaderVisibility = useCallback((nextVisible: boolean) => {
    if (headerVisibleRef.current === nextVisible) return;
    const now = Date.now();
    if (now - lastHeaderToggleTsRef.current < 160) return;

    headerVisibleRef.current = nextVisible;
    lastHeaderToggleTsRef.current = now;
    setTopHeaderVisible(nextVisible);
  }, [setTopHeaderVisible]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;

    // Keep the top app header visible on the Bars page regardless of scroll direction.
    if (!headerVisibleRef.current) {
      setHeaderVisibility(true);
    }

    lastScrollYRef.current = y;
  }, [setHeaderVisibility]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (refetch) await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  useEffect(() => {
    // 1. Explicitly type the parent as a BottomTabNavigationProp
    const tabNavigation = navigation.getParent<BottomTabNavigationProp<any>>();

    if (tabNavigation) {
      // 2. TypeScript will now recognize 'tabPress'
      const unsubscribe = tabNavigation.addListener('tabPress', (e) => {
        const isFocused = navigation.isFocused();

        if (isFocused) {
          // Reset Logic
          setSearch("");
          setFilter(null);
          setHeaderVisibility(true);

          // Reset scroll position if you have the ref
          // flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

          if (refetch) {
            refetch();
          }
        }
      });

      return unsubscribe;
    }
  }, [navigation, refetch, setHeaderVisibility]);

  const visibleBars = useMemo(() => {
    if (!bars) return [];
    const q = search.trim().toLowerCase();
    return bars
      .filter(b => {
        if (filter === "Bars" && b.location_type_id !== 1) return false;
        if (filter === "Restaurants" && b.location_type_id !== 2) return false;
        if (filter === "Favorites" && !isFavorited(String(b.id))) return false;
        if (q && !(b.name?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q))) return false;
        return true;
      })
      .sort((a, b) => Number(isFavorited(b.id)) - Number(isFavorited(a.id)));
  }, [bars, filter, search, isFavorited]);

  if (error || shouldForceErrorPage("bars")) {
    return (
      <View style={styles.container}>
        <ErrorState title="Unable to load bars" subtitle="Please try again later." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* FLOATING HEADER */}
      <Animated.View style={[
        styles.fixedSearchContainer,
        {
          top: 0,
          transform: [{
            translateY: searchBarTop.interpolate({
              inputRange: [insets.top, HEADER_HEIGHT],
              outputRange: [0, 0]
            })
          }],
          paddingTop: 40 + insets.top,
          backgroundColor: Theme.dark.background,
        }
      ]}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={18} color={Theme.search.inactiveInput} />
          <TextInput
            placeholder="Search bars or keywords"
            placeholderTextColor={Theme.search.inactiveInput}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.filters}>
          {["Bars", "Restaurants", "Favorites"].map(option => (
            <FilterTab
              key={option}
              label={option}
              isActive={filter === option}
              onPress={() => setFilter(prev => (prev === option ? null : option))}
            />
          ))}
        </View>
      </Animated.View>

      {loading ? (
        <View style={{ marginTop: TOTAL_TOP_SPACING }}>
          <BarsSkeleton />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={visibleBars}
          keyExtractor={item => String(item.id)}
          // We use ListHeaderComponent just to create a spacer so the first item isn't hidden
          ListHeaderComponent={<View style={{ height: TOTAL_TOP_SPACING }} />}
          contentContainerStyle={[
            styles.barList,
            { paddingBottom: 120 + insets.bottom }
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Theme.dark.primary}
              progressViewOffset={TOTAL_TOP_SPACING}
            />
          }
          renderItem={({ item }) => (
            <BarCard
              item={item}
              isFav={isFavorited(item.id)}
              onToggleFav={() => toggleFavorite(item.id)}
              onPress={(id) => router.push({ pathname: "/(app)/(tabs)/bars/[id]", params: { id } })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filter === "Favorites" ? "You haven't saved any favorites yet." 
                : search.trim().length > 0 ? `No locations found matching "${search}"` 
                  : "No locations match your current filters."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const BarsSkeleton = () => (
  <View style={{ padding: 16 }}>
    {[1, 2, 3, 4].map((i) => (
      <View key={i} style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'center' }}>
        <Skeleton width={70} height={70} borderRadius={12} />
        <View style={{ marginLeft: 12, flex: 1, gap: 8 }}>
          <Skeleton width="60%" height={20} />
          <Skeleton width="80%" height={14} />
        </View>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background
  },
  fixedSearchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Theme.dark.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  searchBar: {
    marginHorizontal: 16,
    backgroundColor: Theme.search.background,
    borderColor: Theme.search.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: Theme.search.input,
    fontSize: 14
  },
  filters: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16
  },
  barList: {
    paddingHorizontal: 16
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center'
  },
  emptyText: {
    color: Theme.search.inactiveInput,
    fontSize: 13,
  },
});

// import React, { useMemo, useState, useEffect, useCallback } from "react";
// import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
// import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
// import { FontAwesome } from "@expo/vector-icons";
// import { useSafeAreaInsets } from "react-native-safe-area-context";
// import { Animated } from 'react-native';

// import { useBars } from "@/hooks/useBars";
// import { shouldForceErrorPage } from "@/utils/dev-error-pages";
// import ErrorState from "@/components/ui/error-state";
// import { Theme } from '@/constants/theme';

// import { BarCard, FilterTab } from "@/components/bars/bar-list-components";
// import { Skeleton, } from "@/components/ui/skeleton";
// import { useFavorites } from '@/context/FavoritesContext';
// import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
// import { useFocusEffect } from '@react-navigation/native';
// import { useTopHeaderVisibility } from '@/context/top-header-visibility';

// const EDGE_TRIGGER_PX = 16;
// const EDGE_UNLOCK_PX = 40;

// export default function Bars() {

//   const insets = useSafeAreaInsets();
//   const HEADER_HEIGHT = 60 + insets.top;
//   const SEARCH_CONTAINER_HEIGHT = 110;

//   const router = useRouter();
//   const [filter, setFilter] = useState<string | null>(null);
//   const [search, setSearch] = useState("");

//   const { bars, loading, error, refetch } = useBars({ q: search || undefined });

//   const [refreshing, setRefreshing] = useState(false);

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       if (refetch) {
//         await refetch();
//       }
//     } catch (err) {
//       console.error("Refresh failed:", err);
//     } finally {
//       setRefreshing(false);
//     }
//   }, [refetch]);

//   const navigation = useNavigation<BottomTabNavigationProp<any>>();
//   // const { setTopHeaderVisible } = useTopHeaderVisibility();
//   const { topHeaderVisible, setTopHeaderVisible } = useTopHeaderVisibility();
//   const lastScrollYRef = React.useRef(0);
//   const headerVisibleRef = React.useRef(true);
//   const lastHeaderToggleTsRef = React.useRef(0);
//   const viewportHeightRef = React.useRef(0);
//   const contentHeightRef = React.useRef(0);
//   const edgeLockRef = React.useRef<'top' | 'bottom' | null>(null);

//   const searchBarTop = React.useRef(new Animated.Value(HEADER_HEIGHT)).current;

//   useEffect(() => {
//     Animated.timing(searchBarTop, {
//       toValue: topHeaderVisible ? HEADER_HEIGHT : insets.top,
//       duration: 250,
//       useNativeDriver: false,
//     }).start();
//   }, [topHeaderVisible, HEADER_HEIGHT, insets.top]);

//   useFocusEffect(
//     React.useCallback(() => {
//       headerVisibleRef.current = true;
//       setTopHeaderVisible(true);
//       return () => {
//         headerVisibleRef.current = true;
//         setTopHeaderVisible(true);
//       };
//     }, [setTopHeaderVisible])
//   );

//   const setHeaderVisibility = React.useCallback(
//     (nextVisible: boolean) => {
//       if (headerVisibleRef.current === nextVisible) {
//         return;
//       }

//       const now = Date.now();
//       if (now - lastHeaderToggleTsRef.current < 160) {
//         return;
//       }

//       headerVisibleRef.current = nextVisible;
//       lastHeaderToggleTsRef.current = now;
//       setTopHeaderVisible(nextVisible);
//     },
//     [setTopHeaderVisible]
//   );

//   const handleScroll = React.useCallback(
//     (event: NativeSyntheticEvent<NativeScrollEvent>) => {
//       const y = event.nativeEvent.contentOffset.y;
//       const layoutHeight = event.nativeEvent.layoutMeasurement.height;
//       const contentHeight = event.nativeEvent.contentSize.height;

//       if (layoutHeight > 0) {
//         viewportHeightRef.current = layoutHeight;
//       }
//       if (contentHeight > 0) {
//         contentHeightRef.current = contentHeight;
//       }

//       const delta = y - lastScrollYRef.current;
//       const maxY = Math.max(0, contentHeightRef.current - viewportHeightRef.current);
//       const isNearTop = y <= EDGE_TRIGGER_PX;
//       const isNearBottom = maxY > 0 && y >= maxY - EDGE_TRIGGER_PX;
//       const isOutOfBounds = y < 0 || y > maxY;

//       if (edgeLockRef.current === 'top' && y > EDGE_UNLOCK_PX) {
//         edgeLockRef.current = null;
//       }
//       if (edgeLockRef.current === 'bottom' && y < maxY - EDGE_UNLOCK_PX) {
//         edgeLockRef.current = null;
//       }

//       if (isNearTop) {
//         edgeLockRef.current = 'top';
//         setHeaderVisibility(true);
//       } else if (isNearBottom || isOutOfBounds) {
//         edgeLockRef.current = 'bottom';
//       } else if (edgeLockRef.current) {
//         // Stay locked until we move away from the edge far enough.
//       } else if (delta > 12 && y > 72) {
//         setHeaderVisibility(false);
//       } else if (delta < -12) {
//         setHeaderVisibility(true);
//       }

//       lastScrollYRef.current = y;
//     },
//     [setHeaderVisibility]
//   );

//   const ListHeader = useMemo(() => (
//     <View style={[
//       styles.searchFilterContainer,
//       {
//         paddingTop: HEADER_HEIGHT + 10,
//         backgroundColor: Theme.dark.background // Prevents bars from showing behind text
//       }
//     ]}>
//       <View style={styles.searchBar}>
//         <FontAwesome name="search" size={18} color={Theme.search.inactiveInput} />
//         <TextInput
//           placeholder="Search bars or keywords"
//           placeholderTextColor={Theme.search.inactiveInput}
//           value={search}
//           onChangeText={setSearch}
//           style={styles.searchInput}
//         />
//       </View>
//       <View style={styles.filters}>
//         {["Bars", "Restaurants", "Favorites"].map(option => (
//           <FilterTab
//             key={option}
//             label={option}
//             isActive={filter === option}
//             onPress={() => setFilter(prev => (prev === option ? null : option))}
//           />
//         ))}
//       </View>
//     </View>
//   ), [search, filter, HEADER_HEIGHT]);

//   // useEffect(() => {

//   //   const tabNavigation = navigation.getParent<BottomTabNavigationProp<any>>();

//   //   if (tabNavigation) {
//   //     const unsubscribe = tabNavigation.addListener('tabPress', (e) => {

//   //       const isFocused = navigation.isFocused();

//   //       if (isFocused) {
//   //         console.log("Martini Icon Tapped - Resetting State");

//   //         setSearch("");
//   //         setFilter(null);
//   //         setHeaderVisibility(true);

//   //         if (refetch) {
//   //           refetch();
//   //         }
//   //       }
//   //     });

//   //     return unsubscribe;
//   //   }
//   // }, [navigation, refetch]);

//   const { isFavorited, toggleFavorite } = useFavorites();

//   const BarsSkeleton = () => (
//     <View style={{ padding: 16 }}>
//       {[1, 2, 3, 4, 5].map((i) => (
//         <View key={i} style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'center' }}>
//           <Skeleton width={70} height={70} borderRadius={12} />
//           <View style={{ marginLeft: 12, flex: 1, gap: 8 }}>
//             <Skeleton width="60%" height={20} />
//             <Skeleton width="40%" height={14} />
//             <Skeleton width="80%" height={14} />
//           </View>
//         </View>
//       ))}
//     </View>
//   );

//   const visibleBars = useMemo(() => {
//     if (!bars) return [];
//     const q = search.trim().toLowerCase();

//     return bars
//       .filter(b => {

//         const id = String(b.id);

//         // Filter by Type
//         if (filter === "Bars" && b.location_type_id !== 1) return false;
//         if (filter === "Restaurants" && b.location_type_id !== 2) return false;

//         // Filter by Favorites (using the Context function)
//         if (filter === "Favorites" && !isFavorited(id)) return false;

//         // Search logic
//         if (q && !(b.name?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q))) return false;

//         return true;
//       })
//       .sort((a, b) => Number(isFavorited(b.id)) - Number(isFavorited(a.id)));

//   }, [bars, filter, search, isFavorited]);

//   if (!!error || shouldForceErrorPage("bars")) {
//     return (
//       <View style={styles.container}>
//         <ErrorState title="Unable to load bars" subtitle="Please try again later." />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       {/* 3. The Animated Search/Filter Header */}
//       <Animated.View style={[
//         styles.fixedSearchContainer,
//         {
//           top: searchBarTop,
//           height: SEARCH_CONTAINER_HEIGHT,
//           backgroundColor: Theme.dark.background,
//         }
//       ]}>
//         <View style={styles.searchBar}>
//           <FontAwesome name="search" size={18} color={Theme.search.inactiveInput} />
//           <TextInput
//             placeholder="Search bars or keywords"
//             placeholderTextColor={Theme.search.inactiveInput}
//             value={search}
//             onChangeText={setSearch}
//             style={styles.searchInput}
//           />
//         </View>
//         <View style={styles.filters}>
//           {["Bars", "Restaurants", "Favorites"].map(option => (
//             <FilterTab
//               key={option}
//               label={option}
//               isActive={filter === option}
//               onPress={() => setFilter(prev => (prev === option ? null : option))}
//             />
//           ))}
//         </View>
//       </Animated.View>

//       {loading ? (
//         <View style={{ marginTop: HEADER_HEIGHT + SEARCH_CONTAINER_HEIGHT }}>
//           <BarsSkeleton />
//         </View>
//       ) : (
//         <FlatList
//           data={visibleBars}
//           keyExtractor={item => String(item.id)}

//           // 2. STICKY HEADER LOGIC
//           ListHeaderComponent={ListHeader}
//           // stickyHeaderIndices={[0]}

//           contentContainerStyle={[
//             styles.barList,
//             {
//               paddingBottom: 120 + insets.bottom
//             }
//           ]}
//           showsVerticalScrollIndicator={false}
//           onScroll={handleScroll}
//           scrollEventThrottle={16} // Snappier for sticky headers
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               tintColor={Theme.dark.primary}
//               colors={[Theme.dark.primary]}
//               progressViewOffset={HEADER_HEIGHT + 80} // Offsets the spinner so it's not hidden
//             />
//           }
//           renderItem={({ item }) => (
//             <BarCard
//               item={item}
//               isFav={isFavorited(item.id)}
//               onToggleFav={() => toggleFavorite(item.id)}
//               onPress={(id) => router.push({ pathname: "/(app)/(tabs)/bars/[id]", params: { id } })}
//             />
//           )}
//           ListEmptyComponent={
//             <View style={styles.emptyContainer}>
//               <Text style={styles.emptyText}>
//                 {filter === "Favorites" ? "You don't have any favorite locations yet" : "No locations match your filters"}
//               </Text>
//             </View>
//           }
//         />
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: Theme.dark.background
//   },
//   searchFilterContainer: {
//     paddingVertical: 10,
//     zIndex: 10,
//   },
//   searchBar: {
//     marginHorizontal: 16,
//     backgroundColor: Theme.search.background,
//     borderColor: Theme.search.border,
//     borderWidth: 1,
//     borderRadius: 12,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     marginBottom: 14,
//   },
//   searchInput: {
//     flex: 1,
//     color: Theme.search.input,
//     fontSize: 14
//   },
//   filters: {
//     flexDirection: "row",
//     justifyContent: "center",
//     gap: 8,
//     paddingHorizontal: 16
//   },
//   barList: {
//     paddingBottom: 80,
//     paddingHorizontal: 16
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center"
//   },
//   emptyText: {
//     color: Theme.search.inactiveInput,
//     fontSize: 13,
//     textAlign: "center"
//   },
//   fixedSearchContainer: {
//     position: 'absolute',
//     left: 0,
//     right: 0,
//     zIndex: 10,
//     paddingBottom: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: 'rgba(255,255,255,0.05)',
//   },
// });