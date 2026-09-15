import { Text } from 'react-native';
import type { IntervalDetailInput } from 'react-native-roster';
import { attendanceModelFor, eventFor } from '../utils/attendance';
import { timeLabel } from '../utils/format';
import { EventLayout } from './layout';
import { Attendances } from './parts/attendances';
import { EventAxis, FutureCaption, LiveCaption, PastCaption } from './parts/axis';
import { EventHeading } from './parts/heading';

/** Selection detail resolves lane metadata, including through portals. */
export function EventDetail(input: IntervalDetailInput) {
  const event = eventFor(input);
  if (!event) return <WorkingHoursDetail {...input} />;
  const model = attendanceModelFor(event);
  const timezone = input.viewTimezone;
  const zones = {
    headingZone: <EventHeading event={event} timezone={timezone} />,
    attendancesZone: <Attendances event={event} scale={model.scale} timezone={timezone} />,
  };
  if (model.status === 'future')
    return (
      <EventLayout
        {...zones}
        axisZone={
          <EventAxis scale={model.scale} timezone={timezone} captionZone={<FutureCaption />} />
        }
      />
    );
  if (model.status === 'live')
    return (
      <EventLayout
        {...zones}
        axisZone={
          <EventAxis scale={model.scale} timezone={timezone} captionZone={<LiveCaption />} />
        }
      />
    );
  return (
    <EventLayout
      {...zones}
      axisZone={<EventAxis scale={model.scale} timezone={timezone} captionZone={<PastCaption />} />}
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
