import { Fragment, type ReactNode } from 'react';
import { Pressable } from 'react-native';
import type { DayColumn, Lane, LaneGeometry } from '../../../core';
import { pressPoint } from '../../primitives/press-point';
import type { ScheduleModel, ScheduleProps } from '../schedule.types';
import { transitionBounds } from '../utils/days';
import { ScheduleDayLayout } from './layout';

type ScheduleDayZones = Required<
  Pick<
    ScheduleProps,
    | 'gridComponent'
    | 'columnComponent'
    | 'transitionComponent'
    | 'intervalComponent'
    | 'gapComponent'
  >
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
  activateInterval: ScheduleModel['activateInterval'];
  activateGap: ScheduleModel['activateGap'];
  boundsFor: ScheduleModel['boundsFor'];
  /** Noninteractive absolute-window chrome projected into this day. */
  windowBandZone?: ReactNode;
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
  activateInterval,
  activateGap,
  boundsFor,
  gridComponent: GridComponent,
  columnComponent: ColumnComponent,
  transitionComponent: TransitionComponent,
  intervalComponent,
  gapComponent,
  windowBandZone,
  nowLineZone,
}: ScheduleDayProps) {
  return (
    <Pressable
      testID={`schedule-day-${day.localDate}`}
      accessible={false}
      tabIndex={-1}
      onPress={(input) => {
        const point = pressPoint(input);
        press(point.x, point.y);
      }}
    >
      <ScheduleDayLayout
        width={projection.columnWidth}
        height={24 * projection.pxPerHour}
        chromeZ={Math.max(0, ...lane.layers.map((layer) => layer.z)) + 1}
        gridZone={<GridComponent hours={hours} pxPerHour={projection.pxPerHour} />}
        columnZone={
          <ColumnComponent
            day={day}
            lane={lane}
            rects={geometry.rects.filter((rect) => rect.column === column)}
            gapRects={geometry.gapRects.filter((rect) => rect.column === column)}
            highlightSource={highlightSource}
            intervalComponent={intervalComponent}
            gapComponent={gapComponent}
            press={press}
            activateInterval={activateInterval}
            activateGap={activateGap}
            boundsFor={boundsFor}
            viewTimezone={projection.viewTimezone}
          />
        }
        windowBandZone={windowBandZone}
        transitionZone={day.transitions.map((transition) => (
          <Fragment key={transition.at}>
            <TransitionComponent
              day={day}
              transition={transition}
              {...transitionBounds(day, transition, projection)}
            />
          </Fragment>
        ))}
        nowLineZone={nowLineZone}
      />
    </Pressable>
  );
}
