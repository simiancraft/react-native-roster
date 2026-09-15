import type { ReactNode } from 'react';
import type { RosterScroll } from '../roster.types';

/** Presentation-only contract shared by native, web, and consumer strategies. */
export type SelectionLayoutProps = {
  /** Mounted body node, rendered once beneath or beside the details. */
  anchorZone: ReactNode;
  /** Mounted detail node, or null when closed. */
  contentZone: ReactNode;
  /** Interval bounds in body-content coordinates, before scroll translation. */
  targetBounds: { x: number; y: number; width: number; height: number } | null;
  /** Whether the detail presentation is open. */
  open: boolean;
  /** Report outside press, hardware back, Escape, or a presentation close action. */
  onDismiss: () => void;
  /** Unique native destination name owned by this selection layout. */
  portalHost: string;
  /** Shared offsets follow body scrolling without updating React state. */
  scroll: Pick<RosterScroll, 'x' | 'y' | 'headerStyle' | 'labelStyle'>;
};
