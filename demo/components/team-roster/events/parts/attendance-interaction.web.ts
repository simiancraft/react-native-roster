import type { PressableProps } from 'react-native';

/** Web focus activates detail only when the browser marks it focus-visible. */
export function attendanceInteraction(
  onActivate: () => void,
  onDeactivate: () => void,
): PressableProps {
  return {
    onHoverIn: onActivate,
    onHoverOut: onDeactivate,
    onFocus(event) {
      const target = event.currentTarget as unknown as {
        matches: (selector: string) => boolean;
      };
      if (target.matches(':focus-visible')) onActivate();
    },
    onBlur: onDeactivate,
  };
}
