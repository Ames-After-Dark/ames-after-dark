// components/tonight/TonightHero.tsx
import React, { useMemo, useState } from "react";
import { View, Pressable, Image, StyleSheet, Dimensions } from "react-native";
import Carousel from 'react-native-reanimated-carousel';

import { IMG } from "@/assets/assets";
import { Theme } from "@/constants/theme";

const { width } = Dimensions.get("window");

// Types
interface HeroPoster {
  id: string;
  barName: string;
  image: any;
}

type BackTarget = "home" | "bars" | "map" | "tonight-open" | "tonight-deals";

interface TonightHeroProps {
  scheduledBars: any[];
  onPosterPress: (id: string, backTo: BackTarget) => void;
}

// Static Poster Data
const HERO_POSTERS: HeroPoster[] = [
  { id: "outlaws-tuesday", barName: "Outlaws", image: IMG.DealOutlawsTuesday },
  { id: "blue-owl-pool-tuesday", barName: "The Blue Owl Bar", image: IMG.DealBlueOwlPoolTuesday },
  { id: "paddys-disney-trivia", barName: "Paddy's Irish Pub", image: IMG.DealPaddysDisneyTrivia },
  { id: "cys-cherry-bombs", barName: "Cy's Roost", image: IMG.DealCysCherryBombs },
];

export default function TonightHero({ scheduledBars, onPosterPress }: TonightHeroProps) {
  
  // State to track current slide for pagination dots
  const [activeIndex, setActiveIndex] = useState(0);

  const processedData = useMemo(() => {
    const normalize = (val: string) => val.toLowerCase().replace(/[^a-z0-9]/g, "");

    return HERO_POSTERS.map((poster) => {
      const posterKey = normalize(poster.barName);
      const matchedBar = scheduledBars.find((bar) => normalize(bar.name) === posterKey);

      return {
        id: poster.id,
        barId: matchedBar ? String(matchedBar.id) : null,
        image: poster.image,
      };
    }).filter(item => item.barId !== null);
  }, [scheduledBars]);

  return (
    <View style={styles.container}>
      <Carousel
        loop
        autoPlay={true}
        autoPlayInterval={10000}
        width={width}
        height={210}
        data={processedData}
        onSnapToItem={(index) => setActiveIndex(index)}

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
        {processedData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot
            ]}
          />
        ))}
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