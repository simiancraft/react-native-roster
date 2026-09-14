import type { Layer, Window } from 'react-native-roster/core';

export function layer(
  id: string,
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
