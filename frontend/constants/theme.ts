import { Platform } from 'react-native';

const themePink = '#ff3399';
const themeBlue = '#33ccff';
const themeYellow = '#ffcc33';
const themeMidnight = '#0f172a';

export const Theme = {
  dark: {
    background: '#0B0C12',
    primary: themePink,
    secondary: themeBlue,
    tertiary: themeYellow,
    muted: '#374151',
    white: '#ffffff',
    black: '#000000',
    success: '#22C55E',
    error: '#F87171',
  },
  search: {
    background: '#111827',
    border: '#1f2937',
    input: '#E5E7EB',
    inactiveInput: '#a3a3a3',
  },
  container: {
    background: themeMidnight,
    mainBorder: '#1f2937',
    secondaryBorder: '#164e63',
    inactiveBorder: '#374151',
    titleText: '#E5E7EB',
    activeText: '#e0f2fe',
    inactiveText: '#cbd5e1'
  }
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
    card: Theme.container.background,
    text: Theme.container.titleText,
    border: Theme.container.mainBorder,
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