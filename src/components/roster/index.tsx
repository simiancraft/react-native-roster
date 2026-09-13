import { useId } from 'react';
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
import { RosterSelectionPopover } from './selection/selection-layout';
import { useRoster } from './use-roster';

const defaultEmptyZone = <RosterEmpty />;
const defaultCornerZone = <RosterCorner />;

export function Roster(props: RosterProps) {
  const {
    selection,
    dismissSelection,
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
    intervalDetailComponent: IntervalDetailComponent,
    selectionLayout: SelectionLayout = RosterSelectionPopover,
    emptyZone = defaultEmptyZone,
    cornerZone = defaultCornerZone,
    headerComponent: HeaderComponent = RosterHeader,
    laneLabelColumnComponent: LaneLabelColumnComponent = RosterLaneLabelColumn,
    bodyComponent: BodyComponent = RosterBody,
    headerCellComponent = RosterHeaderCell,
    laneLabelComponent = RosterLaneLabel,
    intervalComponent = RosterInterval,
    gapComponent = RosterGap,
    gridComponent = RosterGrid,
    incompleteLabel = 'Availability may be incomplete',
    neverSetLabel = 'No availability set',
  } = props;
  const hostId = useId();
  if (status === 'empty') return emptyZone;
  if (window.start === window.end) return null;
  return (
    <RosterLayout
      style={props.style}
      headerStyle={props.headerStyle}
      laneLabelColumnStyle={props.laneLabelColumnStyle}
      bodyStyle={props.bodyStyle}
      laneLabelWidth={props.laneLabelWidth}
      onLayout={onLayout}
      cornerZone={cornerZone}
      headerZone={
        <HeaderComponent
          ticks={ticks}
          projection={projection}
          scroll={scroll}
          contentWidth={contentWidth}
          headerCellComponent={headerCellComponent}
        />
      }
      laneLabelColumnZone={
        <LaneLabelColumnComponent
          labels={orderedLanes.map((lane) => {
            const state = laneState.get(lane.id) ?? {
              flag: 'none',
              complete: true,
            };
            return {
              lane,
              ...state,
              viewTimezone: projection.viewTimezone,
              incompleteLabel,
              neverSetLabel,
            };
          })}
          projection={projection}
          scroll={scroll}
          laneLabelComponent={laneLabelComponent}
        />
      }
      bodyZone={
        <SelectionLayout
          portalHost={props.portalHost ?? `roster-${hostId}`}
          open={selection !== null}
          onDismiss={dismissSelection}
          scroll={scroll}
          anchor={
            selection
              ? {
                  x: selection.rect.x,
                  y:
                    orderedLanes.findIndex((lane) => lane.id === selection.lane.id) *
                    projection.rowHeight,
                  width: selection.rect.width,
                  height: selection.rect.height,
                }
              : null
          }
          contentZone={
            selection && IntervalDetailComponent ? (
              <IntervalDetailComponent
                {...selection}
                viewTimezone={projection.viewTimezone}
                highlighted={selection.rect.sources.some(
                  (source) =>
                    source.kind === props.highlightSource?.kind &&
                    source.id === props.highlightSource.id,
                )}
              />
            ) : null
          }
          anchorZone={
            <BodyComponent
              lanes={orderedLanes}
              window={window}
              geometryFor={geometryFor}
              projection={projection}
              scroll={scroll}
              press={press}
              ticks={ticks}
              contentWidth={contentWidth}
              viewport={viewport}
              intervalComponent={intervalComponent}
              gapComponent={gapComponent}
              gridComponent={gridComponent}
              highlightSource={props.highlightSource}
              onIntervalHover={props.onIntervalHover}
              incompleteLabel={incompleteLabel}
            />
          }
        />
      }
    />
  );
}
