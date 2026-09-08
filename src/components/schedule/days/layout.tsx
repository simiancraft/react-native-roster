import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { pressPoint } from '../../roster/press-point';

type ScheduleDayLayoutProps = {
  width: number;
  height: number;
  label: string;
  press: (x: number, y: number) => void;
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
  label,
  press,
  gridZone,
  columnZone,
  transitionZone,
  nowLineZone,
  chromeZ,
}: ScheduleDayLayoutProps) {
  return (
    <Pressable
      testID={`schedule-day-${label}`}
      accessibilityLabel={label}
      onPress={(input) => {
        const point = pressPoint(input);
        press(point.x, point.y);
      }}
      style={{ width, height, overflow: 'hidden' }}
    >
      {gridZone}
      {columnZone}
      <View pointerEvents="none" style={{ position: 'absolute', width, height, zIndex: chromeZ }}>
        {transitionZone}
        {nowLineZone}
      </View>
    </Pressable>
  );
}
