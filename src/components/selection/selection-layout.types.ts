import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

/** Projection-neutral inputs shared by the native and web selection presentations. */
export type SelectionSurfaceProps = {
  /** Mounted projection node, rendered once beneath or beside the details. */
  anchorZone: ReactNode;
  /** Mounted detail node, or null when closed. */
  contentZone: ReactNode;
  /** Selected bounds in projection-content coordinates, before offset translation. */
  targetBounds: { x: number; y: number; width: number; height: number } | null;
  /** Whether the detail presentation is open. */
  open: boolean;
  /** Report outside press, hardware back, Escape, or a presentation close action. */
  onDismiss: () => void;
  /** Unique native destination name owned by this selection surface. */
  portalHost: string;
  /** Shared projection offsets follow scrolling without updating React state. */
  offsets: { x: SharedValue<number>; y: SharedValue<number> };
};
