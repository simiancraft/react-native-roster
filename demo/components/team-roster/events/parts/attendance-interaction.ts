import type {
  AttendanceInteractionHandlers,
  AttendanceInteractionInput,
} from './attendance-interaction.types';

/** Native attendance detail is active only while the bar is pressed. */
export function attendanceInteraction({
  onActivate,
  onDeactivate,
}: AttendanceInteractionInput): AttendanceInteractionHandlers {
  return {
    onPressIn: () => onActivate('press'),
    onPressOut: () => onDeactivate('press'),
  };
}
