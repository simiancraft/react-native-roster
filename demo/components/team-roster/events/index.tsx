import { Text } from 'react-native';
import type { IntervalDetailInput } from 'react-native-roster';
import { timeLabel } from '../utils/format';
import { memberMeta } from '../utils/team';
import type { MemberEvent } from './event.types';
import { EventLayout } from './layout';
import { Attendances } from './parts/attendances';
import { ActiveAttendance, AttendanceLegend } from './parts/footer';
import { EventHeading } from './parts/heading';
import { useActiveAttendance } from './use-active-attendance';
import { attendanceModelFor, eventFor } from './utils/attendance';

/** Selection detail resolves lane metadata, including through portals. */
export function EventDetail(input: IntervalDetailInput) {
  const event = eventFor(input);
  if (!event) return <WorkingHoursDetail {...input} />;
  return <AttendanceDetail key={event.id} event={event} input={input} />;
}

function AttendanceDetail({ event, input }: { event: MemberEvent; input: IntervalDetailInput }) {
  const timezone = input.viewTimezone;
  const model = attendanceModelFor(event, memberMeta(input.lane).now, timezone);
  const active = useActiveAttendance();
  const row = model.rows.find((row) => row.attendee.id === active.activeId);
  let footerZone = <AttendanceLegend status={model.status} />;
  if (row) footerZone = <ActiveAttendance row={row} />;
  return (
    <EventLayout
      headerZone={<EventHeading event={event} timezone={timezone} />}
      chartZone={
        <Attendances
          model={model}
          timezone={timezone}
          onActivate={active.show}
          onDeactivate={active.hide}
        />
      }
      footerZone={footerZone}
    />
  );
}

function WorkingHoursDetail(input: IntervalDetailInput) {
  return (
    <Text className="rounded-lg bg-card p-3 text-foreground">
      Working hours · {timeLabel(input.start, input.viewTimezone)} to{' '}
      {timeLabel(input.end, input.viewTimezone)}
    </Text>
  );
}
