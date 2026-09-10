import type { ReactNode } from 'react';
import { View } from 'react-native';

type ScheduleDayLayoutProps = {
  width: number;
  height: number;
  /** Stacking level for chrome above every rect; the engine supplies it from the lane's layers. */
  chromeZ: number;
  /** Equal wall-clock hour bands, behind all rects. */
  gridZone: ReactNode;
  /** The day's rects and pressable gaps, at final engine bounds. */
  columnZone: ReactNode;
  /** Noninteractive skipped or repeated region chrome above rects. */
  transitionZone: ReactNode;
  /** Noninteractive current-time line at the projected occurrence. */
  nowLineZone: ReactNode;
};

export function ScheduleDayLayout({
  width,
  height,
  chromeZ,
  gridZone,
  columnZone,
  transitionZone,
  nowLineZone,
}: ScheduleDayLayoutProps) {
  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      {gridZone}
      {columnZone}
      <View pointerEvents="none" style={{ position: 'absolute', width, height, zIndex: chromeZ }}>
        {transitionZone}
        {nowLineZone}
      </View>
    </View>
  );
}
