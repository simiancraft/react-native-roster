import { Fragment } from 'react';
import { View } from 'react-native';
import { RosterGap } from '../layers/parts/gap';
import { RosterInterval } from '../layers/parts/interval';
import { regionStyle } from '../primitives/region-style';
import { ScheduleDay } from './days/day';
import { ScheduleDayHeaderLayout } from './days/header-layout';
import { ScheduleColumn } from './days/parts/column';
import { ScheduleDayHeader } from './days/parts/day-header';
import { ScheduleGrid } from './days/parts/grid';
import { ScheduleNowLine } from './days/parts/now-line';
import { ScheduleSkippedDate } from './days/parts/skipped-date';
import { ScheduleTransition } from './days/parts/transition';
import { ScheduleLayout } from './layout';
import { ScheduleGutter } from './parts/gutter';
import { ScheduleIncomplete } from './parts/incomplete';
import type { ScheduleProps } from './schedule.types';
import { useSchedule } from './use-schedule';
import { ScheduleWidth, useScheduleViewport } from './use-schedule-viewport';
import { headerDates, nowPosition } from './utils/days';

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
      style={regionStyle(
        { flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' },
        { backgroundColor: '#fff' },
        props.style,
      )}
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
      daysZone={days.map((day, column) => (
        <ScheduleDay
          key={day.localDate}
          day={day}
          column={column}
          lane={lane}
          projection={projection}
          geometry={geometry}
          highlightSource={highlightSource}
          hours={hours}
          press={(x, y) => press(column, x, y)}
          gridZone={gridZone}
          columnZone={columnZone}
          transitionZone={transitionZone}
          intervalZone={intervalZone}
          gapZone={gapZone}
          nowLineZone={position?.column === column ? nowLineZone(position) : null}
        />
      ))}
    />
  );
}
