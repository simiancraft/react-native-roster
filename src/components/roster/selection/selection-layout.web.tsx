import { SelectionSurface } from '../../selection/selection-layout.web';
import type { SelectionLayoutProps } from './selection-layout.types';

/** Compatibility adapter from the public Roster selection contract to SelectionSurface. */
export function RosterSelectionPopover({ scroll, ...props }: SelectionLayoutProps) {
  return <SelectionSurface {...props} offsets={{ x: scroll.x, y: scroll.y }} />;
}
