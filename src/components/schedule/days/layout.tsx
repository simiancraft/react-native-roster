import type { ReactNode } from 'react';
import { PlotStack } from '../../layers/plot-stack';

type ScheduleDayLayoutProps = {
  width: number;
  height: number;
  /** Stacking level for chrome above every rect; the engine supplies it from the lane's layers. */
  chromeZ: number;
  /** Equal wall-clock hour bands, behind all rects. */
  gridZone: ReactNode;
  /** The day's rects and pressable gaps, at final engine bounds. */
  columnZone: ReactNode;
  /** Noninteractive absolute-window chrome above rects and below other day chrome. */
  windowBandZone: ReactNode;
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
  windowBandZone,
  transitionZone,
  nowLineZone,
}: ScheduleDayLayoutProps) {
  return (
    <PlotStack
      width={width}
      height={height}
      clip
      overlayZ={chromeZ}
      gridZone={gridZone}
      marksZone={columnZone}
      overlayZone={
        <>
          {windowBandZone}
          {transitionZone}
          {nowLineZone}
        </>
      }
    />
  );
}
