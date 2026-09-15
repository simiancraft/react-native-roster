import type { PressableProps } from 'react-native';

/** Native attendance detail is active only while the bar is pressed. */
export function attendanceInteraction(
  onActivate: () => void,
  onDeactivate: () => void,
): PressableProps {
  return { onPressIn: onActivate, onPressOut: onDeactivate };
}
