import type {
  AttendanceInteractionHandlers,
  AttendanceInteractionInput,
} from './attendance-interaction.types';

/** Web focus activates detail only when the browser marks it focus-visible. */
export function attendanceInteraction({
  accessibilityLabel,
  onActivate,
  onDeactivate,
}: AttendanceInteractionInput): AttendanceInteractionHandlers {
  return {
    accessibilityLabel,
    accessibilityRole: 'button',
    onPress(event) {
      event.stopPropagation();
      onActivate('press');
    },
    onHoverIn: () => onActivate('hover'),
    onHoverOut: () => onDeactivate('hover'),
    onFocus(event) {
      const target = event.currentTarget as unknown as {
        matches: (selector: string) => boolean;
      };
      if (target.matches(':focus-visible')) onActivate('focus');
    },
    onBlur: () => onDeactivate('focus'),
  };
}
