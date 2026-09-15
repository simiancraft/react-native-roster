import type { PressableProps } from 'react-native';

export type AttendanceInteractionKind = 'hover' | 'focus' | 'press';

export interface AttendanceInteractionInput {
  onActivate: (interaction: AttendanceInteractionKind) => void;
  onDeactivate: (interaction: AttendanceInteractionKind) => void;
}

export type AttendanceInteractionHandlers = Pick<
  PressableProps,
  'onHoverIn' | 'onHoverOut' | 'onFocus' | 'onBlur' | 'onPressIn' | 'onPressOut'
>;
