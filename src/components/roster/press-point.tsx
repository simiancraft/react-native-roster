import type { PressPoint, PressPointInput } from './press-point.types';

export function pressPoint({ nativeEvent }: PressPointInput): PressPoint {
  return { x: nativeEvent.locationX as number, y: nativeEvent.locationY as number };
}
