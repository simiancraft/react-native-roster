export type PressPointInput = {
  nativeEvent: { locationX?: number; locationY?: number; clientX?: number; clientY?: number };
  currentTarget?: unknown;
};
export type PressPoint = { x: number; y: number };
