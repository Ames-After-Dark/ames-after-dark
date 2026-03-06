export type ErrorPageKey =
  | "tonight"
  | "map"
  | "barDetail"
  | "barMenu"
  | "locationSettings"
  | "account"
  | "friendProfile"
  | "bars"
  | "gallery";

// Global dev config to force error states for testing UI
const FORCE_ALL_ERROR_PAGES = false;

const FORCE_ERROR_PAGES: Record<ErrorPageKey, boolean> = {
  tonight: false,
  map: false,
  barDetail: false,
  barMenu: false,
  locationSettings: false,
  account: false,
  friendProfile: false,
  bars: false,
  gallery: false,
};

export function shouldForceErrorPage(page: ErrorPageKey): boolean {
  if (!__DEV__) return false;
  return FORCE_ALL_ERROR_PAGES || FORCE_ERROR_PAGES[page];
}
