import type { PressPoint, PressPointInput } from './press-point.types';

export function pressPoint({ nativeEvent, currentTarget }: PressPointInput): PressPoint {
  // React Native Web passes a DOM click, not a native responder event, to onPress.
  const target = currentTarget as {
    getBoundingClientRect(): { left: number; top: number; width: number; height: number };
  };
  const bounds = target.getBoundingClientRect();
  return {
    x:
      typeof nativeEvent.clientX === 'number'
        ? nativeEvent.clientX - bounds.left
        : bounds.width / 2,
    y:
      typeof nativeEvent.clientY === 'number'
        ? nativeEvent.clientY - bounds.top
        : bounds.height / 2,
  };
}
