import type { Layer, Window } from 'react-native-roster/core';

export const ATTENDANCE_LAYER = {
  plan: 'plan',
  presence: 'presence',
  together: 'together',
} as const;

export type AttendanceLayer = (typeof ATTENDANCE_LAYER)[keyof typeof ATTENDANCE_LAYER];

export function layer(
  id: AttendanceLayer,
  role: Layer['role'],
  z: number,
  bounds: Window,
  inset: number,
): Layer {
  return {
    id,
    role,
    z,
    style: { color: 'transparent', inset },
    intervals: [{ ...bounds, sources: [{ kind: 'attendance', id }] }],
  };
}
