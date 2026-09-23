import { SelectionSurface } from '../../selection/selection-layout';
import type { SelectionLayoutProps } from './selection-layout.types';

/** Roster compatibility adapter for the projection-neutral selection surface. */
export function RosterSelectionPopover(props: SelectionLayoutProps) {
  return <SelectionSurface {...props} offsets={props.scroll} />;
}
