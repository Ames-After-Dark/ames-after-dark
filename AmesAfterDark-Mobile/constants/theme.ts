/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

/**
 * Base color palettes. Keep these for backward compatibility but prefer using
 * the semantic `Theme` below in new code.
 */
// The app uses a single dark theme for now. Keep the `light` keys but point them
// to the same values as `dark` so legacy usage of `Colors.light.*` won't fail.
export const Colors = {
  light: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

/**
 * Semantic theme tokens. These provide an application-level contract for colors
 * that components should consume (primary, surface, border, error, success,
 * etc.). This makes changing the app's visual identity or adding more tokens
 * later much easier.
 */
// Single dark theme: map both `light` and `dark` to the dark tokens so the app
// always renders in dark mode while keeping existing code paths intact.
export const Theme = {
  light: {
    primary: tintColorDark,
    onPrimary: '#000000',
    background: Colors.dark.background,
    surface: '#111213',
    onSurface: Colors.dark.text,
    text: Colors.dark.text,
    muted: '#9BA1A6',
    border: '#222628',
    icon: Colors.dark.icon,
    success: '#22C55E',
    error: '#F87171',
  },
  dark: {
    primary: tintColorDark,
    onPrimary: '#000000',
    background: Colors.dark.background,
    surface: '#111213',
    onSurface: Colors.dark.text,
    text: Colors.dark.text,
    muted: '#9BA1A6',
    border: '#222628',
    icon: Colors.dark.icon,
    success: '#22C55E',
    error: '#F87171',
  },
};

/**
 * React Navigation theme objects built from our semantic tokens. Use these
 * with Navigation's ThemeProvider so the navigation components (headers,
 * tab bars) follow our app theme.
 */
// Use the dark navigation theme for both light and dark navigation consumers.
export const NavigationThemeLight = {
  dark: true,
  colors: {
    primary: Theme.dark.primary,
    background: Theme.dark.background,
    card: Theme.dark.surface,
    text: Theme.dark.text,
    border: Theme.dark.border,
    notification: Theme.dark.primary,
  },
  fonts: {},
};

export const NavigationThemeDark = NavigationThemeLight;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
