import type { ComponentType } from 'react';
import { createContext, useContext } from 'react';
import { Text, View } from 'react-native';
import type { GapInput, IntervalInput } from 'react-native-roster';
import type { LayerRole } from 'react-native-roster/core';
import { actualWindows, barOffsets, eventFor } from '../events/utils/attendance';
import { timeLabel } from '../utils/format';
import { memberMeta } from '../utils/team';
import { timeOffPresentation } from '../utils/time-off';
import { eventKindOf, KIND_CLASSES, TONE_CLASSES } from '../utils/tones';

function bounds(rect: IntervalInput['rect']) {
  return {
    position: 'absolute' as const,
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
    zIndex: rect.z,
  };
}

/** Working hours: a soft band in the member's tone. */
export function AvailabilityBand({ rect, lane }: IntervalInput) {
  const { member } = memberMeta(lane);
  return (
    <View
      pointerEvents="none"
      style={bounds(rect)}
      className={`rounded-md border ${TONE_CLASSES[member.tone].band}`}
    />
  );
}

const HIGHLIGHT = { on: 'border-2 border-foreground', off: 'border' } as const;

/** A booked event: colored by kind, labeled when wide enough. */
export function EventCard({
  rect,
  lane,
  highlighted,
  timezone,
}: IntervalInput & { timezone: string }) {
  const source = rect.sources[0];
  const event = eventFor({ rect, lane });
  const actual = event ? actualWindows(event, memberMeta(lane).now) : [];
  const interval = lane.layers
    .flatMap((layer) => layer.intervals)
    .find(
      (item) =>
        item.sources.length === 1 &&
        item.sources[0]?.id === event?.id &&
        item.sources[0]?.kind === event?.kind,
    );
  const bars =
    event && interval
      ? actual.map((span) => ({ span, bar: barOffsets(span, interval, rect.width) }))
      : [];
  const kind = KIND_CLASSES[eventKindOf(source?.kind ?? 'meeting')];
  const title = event?.title ?? source?.label ?? 'Event';
  const time = event ? timeLabel(event.start, timezone) : '';
  const label =
    rect.width >= 56 ? (
      <Text numberOfLines={1} className={`text-[11px] font-semibold ${kind.title}`}>
        {title}
      </Text>
    ) : null;
  const clock =
    rect.width >= 96 ? (
      <Text numberOfLines={1} className={`text-[10px] ${kind.time}`}>
        {time}
      </Text>
    ) : null;
  return (
    <View
      pointerEvents="none"
      style={bounds(rect)}
      className={`overflow-visible justify-center rounded-md px-1.5 ${kind.card} ${HIGHLIGHT[highlighted ? 'on' : 'off']}`}
    >
      {label}
      {clock}
      {bars.map(({ span, bar }) => (
        <View
          key={span.start}
          testID="team-attendance-strip"
          className={`absolute bottom-0 h-1 ${kind.dot}`}
          style={bar}
        />
      ))}
    </View>
  );
}

export const TeamTimezone = createContext('UTC');

const ROLE_COMPONENTS: Record<LayerRole, ComponentType<IntervalInput & { timezone: string }>> = {
  availability: AvailabilityBand,
  booking: EventCard,
  custom: AvailabilityBand,
};

/** Horizontal roster interval; the layer role selects the part. */
export function TeamInterval(input: IntervalInput) {
  const timezone = useContext(TeamTimezone);
  const Component = ROLE_COMPONENTS[input.layer.role];
  return <Component {...input} timezone={timezone} />;
}

/** Removed time inside working hours: lunch and out-of-office days. */
export function TimeOffGap({ rect }: GapInput) {
  const presentation = timeOffPresentation(rect.sources);
  const label =
    rect.width >= 200 && presentation.label ? (
      <Text
        numberOfLines={1}
        className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
      >
        {presentation.label}
      </Text>
    ) : null;
  return (
    <View
      pointerEvents="none"
      className={`flex-1 items-center justify-center rounded-md ${presentation.className}`}
    >
      {label}
    </View>
  );
}

function ScheduleEventCard(input: IntervalInput) {
  const source = input.rect.sources[0];
  const kind = KIND_CLASSES[eventKindOf(source?.kind ?? 'meeting')];
  return (
    <View
      pointerEvents="none"
      testID="team-schedule-event"
      style={bounds(input.rect)}
      className={`rounded-sm ${kind.card} ${HIGHLIGHT[input.highlighted ? 'on' : 'off']}`}
    >
      <Text numberOfLines={1} className={`text-[9px] ${kind.title}`}>
        {source?.label ?? 'Event'}
      </Text>
    </View>
  );
}

const SCHEDULE_ROLE_COMPONENTS: Record<LayerRole, ComponentType<IntervalInput>> = {
  availability: AvailabilityBand,
  booking: ScheduleEventCard,
  custom: AvailabilityBand,
};

/** Schedule columns omit the horizontal attendance strip. Detail keeps the shared scale. */
export function TeamScheduleInterval(input: IntervalInput) {
  const Component = SCHEDULE_ROLE_COMPONENTS[input.layer.role];
  return <Component {...input} />;
}
