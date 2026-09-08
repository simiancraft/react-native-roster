import { RosterLayout } from './layout';
import { RosterBody } from './parts/body';
import { RosterEmpty } from './parts/empty';
import { RosterGap } from './parts/gap';
import { RosterHeader } from './parts/header';
import { RosterHeaderCell } from './parts/header-cell';
import { RosterInterval } from './parts/interval';
import { RosterLaneLabel } from './parts/lane-label';
import { RosterLaneLabelColumn } from './parts/lane-label-column';
import type { RosterProps } from './roster.types';
import { useRoster } from './use-roster';

export function Roster(props: RosterProps) {
  const {
    status,
    orderedLanes,
    laneState,
    window,
    geometryFor,
    projection,
    scroll,
    press,
    ticks,
    contentWidth,
    viewport,
    onLayout,
  } = useRoster(props);
  const {
    emptyZone = RosterEmpty,
    headerZone = RosterHeader,
    laneLabelColumnZone = RosterLaneLabelColumn,
    bodyZone = RosterBody,
    headerCellZone = RosterHeaderCell,
    laneLabelZone = RosterLaneLabel,
    intervalZone = RosterInterval,
    gapZone = RosterGap,
    incompleteLabel = 'Availability may be incomplete',
    neverSetLabel = 'No availability set',
  } = props;
  if (status === 'empty') return emptyZone();
  return (
    <RosterLayout
      style={props.style}
      onLayout={onLayout}
      headerZone={headerZone({ ticks, projection, scroll, contentWidth, headerCellZone })}
      laneLabelColumnZone={laneLabelColumnZone({
        labels: orderedLanes.map((lane) => {
          const state = laneState.get(lane.id) ?? { flag: 'none', complete: true };
          return {
            lane,
            ...state,
            viewTimezone: projection.viewTimezone,
            incompleteLabel,
            neverSetLabel,
          };
        }),
        projection,
        scroll,
        laneLabelZone,
      })}
      bodyZone={bodyZone({
        lanes: orderedLanes,
        window,
        geometryFor,
        projection,
        scroll,
        press,
        ticks,
        contentWidth,
        viewport,
        intervalZone,
        gapZone,
        highlightSource: props.highlightSource,
      })}
    />
  );
}
