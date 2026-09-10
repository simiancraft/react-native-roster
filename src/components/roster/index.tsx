import { RosterGap } from '../layers/parts/gap';
import { RosterInterval } from '../layers/parts/interval';
import { RosterLaneLabel } from './lanes/parts/lane-label';
import { RosterLayout } from './layout';
import { RosterBody } from './parts/body';
import { RosterCorner } from './parts/corner';
import { RosterEmpty } from './parts/empty';
import { RosterGrid } from './parts/grid';
import { RosterHeader } from './parts/header';
import { RosterHeaderCell } from './parts/header-cell';
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
    cornerZone = RosterCorner,
    headerZone = RosterHeader,
    laneLabelColumnZone = RosterLaneLabelColumn,
    bodyZone = RosterBody,
    headerCellZone = RosterHeaderCell,
    laneLabelZone = RosterLaneLabel,
    intervalZone = RosterInterval,
    gapZone = RosterGap,
    gridZone = RosterGrid,
    incompleteLabel = 'Availability may be incomplete',
    neverSetLabel = 'No availability set',
  } = props;
  if (status === 'empty') return emptyZone();
  if (window.start === window.end) return null;
  return (
    <RosterLayout
      style={props.style}
      headerStyle={props.headerStyle}
      laneLabelColumnStyle={props.laneLabelColumnStyle}
      bodyStyle={props.bodyStyle}
      laneLabelWidth={props.laneLabelWidth}
      onLayout={onLayout}
      cornerZone={cornerZone()}
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
        gridZone,
        highlightSource: props.highlightSource,
        onIntervalHover: props.onIntervalHover,
        incompleteLabel,
      })}
    />
  );
}
