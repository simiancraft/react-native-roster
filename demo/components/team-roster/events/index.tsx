import { Text } from 'react-native';
import type { IntervalDetailInput } from 'react-native-roster';
import { timeLabel } from '../utils/format';
import { memberMeta } from '../utils/team';
import { EventLayout } from './layout';
import { Attendances } from './parts/attendances';
import { EventAxis, FutureCaption, LiveCaption, PastCaption } from './parts/axis';
import { EventHeading } from './parts/heading';
import { attendanceModelFor, eventFor } from './utils/attendance';

/** Selection detail resolves lane metadata, including through portals. */
export function EventDetail(input: IntervalDetailInput) {
  const event = eventFor(input);
  if (!event) return <WorkingHoursDetail {...input} />;
  const model = attendanceModelFor(event, memberMeta(input.lane).now);
  const timezone = input.viewTimezone;
  const zones = {
    headingZone: <EventHeading event={event} timezone={timezone} />,
    attendancesZone: <Attendances {...model} timezone={timezone} />,
  };
  const Caption = CAPTIONS[model.status];
  return (
    <EventLayout
      {...zones}
      axisZone={<EventAxis scale={model.scale} timezone={timezone} captionZone={<Caption />} />}
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

const CAPTIONS = { future: FutureCaption, live: LiveCaption, past: PastCaption };
