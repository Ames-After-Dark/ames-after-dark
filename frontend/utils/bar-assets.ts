import { IMG } from "@/assets/assets";

const barCoverMap: { [key: string]: any } = {
  "AJ's Ultralounge": IMG.CysCover,
  "BNC Fieldhouse": IMG.BaseCover,
  "Cy's Roost": IMG.CysCover2,
  "Welch Ave Station": IMG.PaddysCover,
  "The Blue Owl Bar": IMG.BaseCover,
  "Paddy's Irish Pub": IMG.SipsPaddysCover2,
  "Sips": IMG.SipsCover,
  "Mickey's Irish Pub": IMG.BaseCover,
  "Outlaws": IMG.OutlawsCover,
};

const barLogoMap: { [key: string]: any } = {
  "AJ's Ultralounge": IMG.AJs,
  "BNC Fieldhouse": IMG.bnc,
  "Cy's Roost": IMG.CysRoost,
  "Welch Ave Station": IMG.Welch,
  "The Blue Owl Bar": IMG.BlueOwl,
  "Paddy's Irish Pub": IMG.Paddys,
  "Sips": IMG.Sips,
  "Mickey's Irish Pub": IMG.Mickey,
  "Outlaws": IMG.Outlaws,
};

export interface Bar {
  name: string;
  coverUrl?: string;
  logoUrl?: string;
  mapImageUrl?: string;
  galleryImageUrl?: string;
  [key: string]: any;
}

export const getBarAssets = (bar: Bar) => {
  return {
    cover: barCoverMap[bar.name] || (bar.coverUrl ? { uri: bar.coverUrl } : IMG.CysCover),
    logo: barLogoMap[bar.name] || (bar.logoUrl ? { uri: bar.logoUrl } : IMG.LOGO),
    map: bar.mapImageUrl ? { uri: bar.mapImageUrl } : IMG.MAP,
    gallery: bar.galleryImageUrl ? { uri: bar.galleryImageUrl } : IMG.GALLERY,
  };
};

/**
 * Gets the correct image source for a bar.
 * Priority: Hardcoded Map > Backend URL > Local Require > Default Logo
 */
export const getBarImageSource = (item: any) => {
  return (
    barCoverMap[item.name] ||
    (item.logoUrl ? { uri: item.logoUrl } : item.logo) ||
    IMG.LOGO
  );
};

export const getBarLogoSource = (item: any) => {
  return (
    barLogoMap[item.name] ||
    (item.logoUrl ? { uri: item.logoUrl } : item.logo) ||
    IMG.LOGO
  );
};