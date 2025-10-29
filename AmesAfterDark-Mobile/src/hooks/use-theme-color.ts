/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';

/**
 * For now the app uses a single dark theme. This hook keeps the same API but
 * always resolves to the dark palette so existing components don't need to
 * change.
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.dark
) {
  // Prefer an explicit `dark` override from props, otherwise use the dark
  // palette.
  if (props.dark) {
    return props.dark;
  }

  return Colors.dark[colorName];
}
