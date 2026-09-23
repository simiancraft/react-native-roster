import type { ReactNode } from 'react';
import { View } from 'react-native';

export type PlotStackProps = {
  /** Width of the plot bounds. */
  width: number;
  /** Height of the plot bounds. */
  height: number;
  /** Whether the plot clips children to its bounds. */
  clip?: boolean;
  /** Stacking level for the optional overlay above the plot marks. */
  overlayZ: number;
  /** Noninteractive grid behind the plot marks. */
  gridZone: ReactNode;
  /** Projection-specific marks at their final bounds. */
  marksZone: ReactNode;
  /** Noninteractive chrome above the grid and marks. */
  overlayZone?: ReactNode;
};

/**
 * Arranges the shared inner plot used by RosterBodyLayout and ScheduleDayLayout.
 */
export function PlotStack({
  width,
  height,
  clip,
  overlayZ,
  gridZone,
  marksZone,
  overlayZone,
}: PlotStackProps) {
  let overlay: ReactNode = null;
  if (overlayZone != null) {
    overlay = (
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: overlayZ }}
      >
        {overlayZone}
      </View>
    );
  }

  return (
    <View style={{ width, height, ...(clip ? { overflow: 'hidden' as const } : null) }}>
      {gridZone}
      {marksZone}
      {overlay}
    </View>
  );
}
