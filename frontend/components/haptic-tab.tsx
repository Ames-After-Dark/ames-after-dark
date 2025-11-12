import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { StyleProp, ViewStyle } from 'react-native'; // Import style types

export function HapticTab(props: BottomTabBarButtonProps) {

  // Destructure pointerEvents, style, and onPressIn from props
  const { pointerEvents, style, onPressIn, ...restProps } = props;

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