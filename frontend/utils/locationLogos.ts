import { ImageSourcePropType } from "react-native";

export const logoAssetMap: { [key: string]: ImageSourcePropType } = {
  "AJ's Ultralounge": require("../assets/images/logos/AJs_Ultra_Lounge.png"),
  "BNC Fieldhouse": require("../assets/images/logos/bnc.png"),
  "Cy's Roost": require("../assets/images/logos/Cys_Roost.png"),
  "Welch Ave Station": require("../assets/images/logos/Welch_Ave_Station.png"),
  "The Blue Owl Bar": require("../assets/images/logos/blue_owl.png"),
  "Paddy's Irish Pub": require("../assets/images/logos/paddy.png"),
  Sips: require("../assets/images/logos/sips.png"),
  "Mickey's Irish Pub": require("../assets/images/logos/mickey.png"),
  Outlaws: require("../assets/images/logos/outlaws.png"),
  default: require("../assets/images/Logo.png"),
};

export const normalizeLocationName = (name?: string) =>
  (name ?? "").trim().toLowerCase().replace(/[’']/g, "'");

const normalizedLogoAssetMap: Record<string, ImageSourcePropType> =
  Object.fromEntries(
    Object.entries(logoAssetMap).map(([key, value]) => [
      normalizeLocationName(key),
      value,
    ])
  );

export const getLogoAssetForLocationName = (
  name?: string
): ImageSourcePropType =>
  normalizedLogoAssetMap[normalizeLocationName(name)] || logoAssetMap.default;
