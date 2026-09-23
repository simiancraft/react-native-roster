import { createContext, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { SCHEDULE_GUTTER_WIDTH } from './constants';

// Standalone hooks use a 280 px grid; the chassis supplies its measured grid width.
export const ScheduleWidth = createContext(280);

export function useScheduleViewport() {
  const [width, setWidth] = useState<number | null>(null);
  function onLayout({ nativeEvent: { layout } }: LayoutChangeEvent) {
    setWidth(Math.max(0, layout.width - SCHEDULE_GUTTER_WIDTH));
  }
  return { width, onLayout };
}
