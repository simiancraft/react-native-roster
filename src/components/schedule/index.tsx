import { Fragment } from 'react';
import { View } from 'react-native';
import { RosterGap } from '../roster/parts/gap';
import { RosterInterval } from '../roster/parts/interval';
import { ScheduleDayHeaderLayout } from './days/header-layout';
import { ScheduleDayLayout } from './days/layout';
import { ScheduleLayout } from './layout';
import { ScheduleColumn } from './parts/column';
import { ScheduleDayHeader } from './parts/day-header';
import { ScheduleGrid } from './parts/grid';
import { ScheduleGutter } from './parts/gutter';
import { ScheduleIncomplete } from './parts/incomplete';
import { ScheduleNowLine } from './parts/now-line';
import { ScheduleSkippedDate } from './parts/skipped-date';
import { ScheduleTransition } from './parts/transition';
import type { ScheduleProps } from './schedule.types';
import { useSchedule } from './use-schedule';
import { ScheduleWidth, useScheduleViewport } from './use-schedule-viewport';
import { headerDates, nowPosition, transitionBounds } from './utils/days';

const hours = Array.from({ length: 24 }, (_, hour) => hour);

export function Schedule(props: ScheduleProps) {
  const { width, onLayout } = useScheduleViewport();
  // Wait for measurement so the first mounted projection is the actual viewport key.
  const content =
    width === null ? null : (
      <ScheduleWidth.Provider value={width}>
        <ScheduleContent {...props} />
      </ScheduleWidth.Provider>
    );
  return (
    <View
      onLayout={onLayout}
      style={[
        { flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden', backgroundColor: '#fff' },
        props.style,
      ]}
    >
      {content}
    </View>
  );
}

function ScheduleContent(props: ScheduleProps) {
  const { days, projection, geometry, now, press } = useSchedule(props);
  const {
    lane,
    windowSpec,
    highlightSource,
    gutterZone = ScheduleGutter,
    dayHeaderZone = ScheduleDayHeader,
    skippedDateZone = ScheduleSkippedDate,
    columnZone = ScheduleColumn,
    gridZone = ScheduleGrid,
    transitionZone = ScheduleTransition,
    nowLineZone = ScheduleNowLine,
    intervalZone = RosterInterval,
    gapZone = RosterGap,
    incompleteZone = ScheduleIncomplete,
    incompleteLabel = 'Availability may be incomplete',
  } = props;
  const position = nowPosition(projection, now);
  const incomplete =
    lane.complete === false ? incompleteZone({ lane, label: incompleteLabel }) : null;
  return (
    <ScheduleLayout
      headerStyle={props.headerStyle}
      gutterStyle={props.gutterStyle}
      daysStyle={props.daysStyle}
      incompleteZone={incomplete}
      gutterZone={gutterZone({ hours, pxPerHour: projection.pxPerHour })}
      dayHeaderZone={headerDates(windowSpec, days).map(({ localDate, day }) => {
        if (!day) return <Fragment key={localDate}>{skippedDateZone({ localDate })}</Fragment>;
        return (
          <ScheduleDayHeaderLayout
            key={localDate}
            width={projection.columnWidth}
            headerZone={dayHeaderZone({ day })}
          />
        );
      })}
      daysZone={days.map((day, column) => {
        const nowLine = position?.column === column ? nowLineZone(position) : null;
        return (
          <ScheduleDayLayout
            key={day.localDate}
            label={day.localDate}
            width={projection.columnWidth}
            height={24 * projection.pxPerHour}
            chromeZ={Math.max(0, ...lane.layers.map((layer) => layer.z)) + 1}
            press={(x, y) => press(column, x, y)}
            gridZone={gridZone({ hours, pxPerHour: projection.pxPerHour })}
            columnZone={columnZone({
              day,
              lane,
              rects: geometry.rects.filter((rect) => rect.column === column),
              gapRects: geometry.gapRects.filter((rect) => rect.column === column),
              highlightSource,
              intervalZone,
              gapZone,
              press: (x, y) => press(column, x, y),
            })}
            transitionZone={day.transitions.map((transition) => (
              <Fragment key={transition.at}>
                {transitionZone({
                  day,
                  transition,
                  ...transitionBounds(day, transition, projection),
                })}
              </Fragment>
            ))}
            nowLineZone={nowLine}
          />
        );
      })}
    />
  );
}
