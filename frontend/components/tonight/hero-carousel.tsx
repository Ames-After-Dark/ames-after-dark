import React, { useMemo, useState } from "react";
import { View, Pressable, Image, StyleSheet, Dimensions } from "react-native";
import Carousel from 'react-native-reanimated-carousel';

import type { ActiveBanner } from "@/services/bannerService";
import { Theme } from "@/constants/theme";

const { width } = Dimensions.get("window");

type BackTarget = "home" | "bars" | "map" | "tonight-open" | "tonight-deals";

interface TonightHeroProps {
  banners: ActiveBanner[];
  scheduledBars: any[];
  onPosterPress: (id: string, backTo: BackTarget) => void;
}

export default function TonightHero({ banners, scheduledBars, onPosterPress }: TonightHeroProps) {

  // State to track current slide for pagination dots
  const [activeIndex, setActiveIndex] = useState(0);

  const processedData = useMemo(() => {
    return banners
      .map((banner) => {
        const matchedBar = scheduledBars.find(
          (bar) => Number(bar.id) === Number(banner.location_id)
        );

        return {
          id: String(banner.id),
          barId: matchedBar ? String(matchedBar.id) : null,
          image: { uri: banner.image_url },
        };
      })
      .filter((item) => item.barId !== null);
  }, [banners, scheduledBars]);

  if (!processedData.length) return null;

  return (
    <View style={styles.container}>
      <Carousel
        loop
        autoPlay={true}
        autoPlayInterval={10000}
        width={width}
        height={210}
        data={processedData}
        // onSnapToItem={(index) => setActiveIndex(index)}

        onProgressChange={(_, absoluteProgress) => {

          const nextIndex = Math.round(absoluteProgress);
          const wrappedIndex = ((nextIndex % processedData.length) + processedData.length) % processedData.length;

          if (wrappedIndex !== activeIndex) {
            setActiveIndex(wrappedIndex);
          }
        }}

        // Render the item centered within the full-width slide
        renderItem={({ item }) => (
          <View style={styles.slideWrapper}>
            <Pressable
              onPress={() => onPosterPress(item.barId!, "home")}
              style={styles.posterPressable}
            >
              <Image
                source={item.image}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </Pressable>
          </View>
        )}
      />

      {/* Pagination Indicators (Scroll Dots) */}
      <View style={styles.paginationRow}>
        {processedData.map((_, index) => {
          const isActive = activeIndex === index;
          return (
            <View
              key={index}
              style={[
                styles.dot,
                isActive ? styles.activeDot : styles.inactiveDot,
                { opacity: isActive ? 1 : 0.4 }
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: width,
    marginBottom: 16,
    marginTop: 8,
  },
  posterPressable: {
    width: width * 0.92,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  heroImage: {
    width: width - 64,
    height: 210,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.container.mainBorder,
    backgroundColor: Theme.container.background,
  },
  slideWrapper: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: Theme.dark.primary,
    width: 20,
  },
  inactiveDot: {
    backgroundColor: Theme.container.inactiveBorder,
    width: 8,
  },
});