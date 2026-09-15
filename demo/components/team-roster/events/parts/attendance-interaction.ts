import type {
  AttendanceInteractionHandlers,
  AttendanceInteractionInput,
} from './attendance-interaction.types';

/** Native attendance detail is toggled by tapping the bar. */
export function attendanceInteraction({
  onActivate,
}: AttendanceInteractionInput): AttendanceInteractionHandlers {
  return {
    accessibilityRole: 'button',
    onPress(event) {
      event.stopPropagation();
      onActivate('press');
    },
  };
}
