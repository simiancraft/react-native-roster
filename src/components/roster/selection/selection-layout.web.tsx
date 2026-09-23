import { SelectionSurface } from '../../selection/selection-layout.web';
import type { SelectionLayoutProps } from './selection-layout.types';

/** Web Roster compatibility adapter for the projection-neutral selection surface. */
export function RosterSelectionPopover(props: SelectionLayoutProps) {
  return <SelectionSurface {...props} offsets={props.scroll} />;
}
