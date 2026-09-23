import type { PressableProps } from 'react-native';

export type AttendanceInteractionKind = 'hover' | 'focus' | 'press';

export interface AttendanceInteractionInput {
  accessibilityLabel: string;
  onActivate: (interaction: AttendanceInteractionKind) => void;
  onDeactivate: (interaction: AttendanceInteractionKind) => void;
}

export type AttendanceInteractionHandlers = Pick<
  PressableProps,
  | 'accessibilityLabel'
  | 'accessibilityRole'
  | 'onBlur'
  | 'onFocus'
  | 'onHoverIn'
  | 'onHoverOut'
  | 'onPress'
>;
