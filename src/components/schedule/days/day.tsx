import { Fragment, type ReactNode } from 'react';
import type { DayColumn, Lane, LaneGeometry } from '../../../core';
import type { ScheduleModel, ScheduleProps } from '../schedule.types';
import { transitionBounds } from '../utils/days';
import { ScheduleDayLayout } from './layout';

type ScheduleDayZones = Required<
  Pick<ScheduleProps, 'gridZone' | 'columnZone' | 'transitionZone' | 'intervalZone' | 'gapZone'>
>;

type ScheduleDayProps = ScheduleDayZones & {
  day: DayColumn;
  column: number;
  lane: Lane;
  projection: ScheduleModel['projection'];
  geometry: LaneGeometry;
  highlightSource: ScheduleProps['highlightSource'];
  hours: number[];
  press: (x: number, y: number) => void;
  /** The current-time line when it falls on this day; otherwise nothing. */
  nowLineZone: ReactNode;
};

/** One day column: grid, rects, transitions, and the now line at engine bounds. */
export function ScheduleDay({
  day,
  column,
  lane,
  projection,
  geometry,
  highlightSource,
  hours,
  press,
  gridZone,
  columnZone,
  transitionZone,
  intervalZone,
  gapZone,
  nowLineZone,
}: ScheduleDayProps) {
  return (
    <ScheduleDayLayout
      label={day.localDate}
      width={projection.columnWidth}
      height={24 * projection.pxPerHour}
      chromeZ={Math.max(0, ...lane.layers.map((layer) => layer.z)) + 1}
      press={press}
      gridZone={gridZone({ hours, pxPerHour: projection.pxPerHour })}
      columnZone={columnZone({
        day,
        lane,
        rects: geometry.rects.filter((rect) => rect.column === column),
        gapRects: geometry.gapRects.filter((rect) => rect.column === column),
        highlightSource,
        intervalZone,
        gapZone,
        press,
      })}
      transitionZone={day.transitions.map((transition) => (
        <Fragment key={transition.at}>
          {transitionZone({ day, transition, ...transitionBounds(day, transition, projection) })}
        </Fragment>
      ))}
      nowLineZone={nowLineZone}
    />
  );
}
