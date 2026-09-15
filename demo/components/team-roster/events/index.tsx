import { Text } from 'react-native';
import type { IntervalDetailInput } from 'react-native-roster';
import { timeLabel } from '../utils/format';
import { memberMeta } from '../utils/team';
import { EventLayout } from './layout';
import { Attendances } from './parts/attendances';
import { EventFooter } from './parts/footer';
import { EventHeading } from './parts/heading';
import { attendanceModelFor, eventFor } from './utils/attendance';

/** Selection detail resolves lane metadata, including through portals. */
export function EventDetail(input: IntervalDetailInput) {
  const event = eventFor(input);
  if (!event) return <WorkingHoursDetail {...input} />;
  const timezone = input.viewTimezone;
  const model = attendanceModelFor(event, memberMeta(input.lane).now, timezone);
  return (
    <EventLayout
      headerZone={<EventHeading event={event} timezone={timezone} />}
      chartZone={<Attendances key={event.id} model={model} timezone={timezone} />}
      footerZone={<EventFooter status={model.status} />}
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
