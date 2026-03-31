import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { StyleProp, ViewStyle } from 'react-native'; // Import style types

const TAB_BUTTON_HIT_SLOP = { top: 16, bottom: 16, left: 16, right: 16 };
const TAB_BUTTON_PRESS_RETENTION = { top: 16, bottom: 16, left: 16, right: 16 };

export function HapticTab(props: BottomTabBarButtonProps) {

  // Destructure pointerEvents, style, and onPressIn from props
  const { pointerEvents, style, onPressIn, hitSlop, pressRetentionOffset, ...restProps } = props;

  // Create a new style object
  const combinedStyle: StyleProp<ViewStyle> = [
    style,
    // Add pointerEvents to the style object if it exists
    pointerEvents ? { pointerEvents } : {},
  ];

  return (
    <PlatformPressable
      {...restProps} // Pass the rest of the props
      style={combinedStyle} // Pass the new combined style
      hitSlop={hitSlop ?? TAB_BUTTON_HIT_SLOP}
      pressRetentionOffset={pressRetentionOffset ?? TAB_BUTTON_PRESS_RETENTION}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tabs.
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev); // Use the destructured onPressIn from props
      }}
    />
  );
}