import type { ComponentType } from 'react';
import { createContext, useContext } from 'react';
import { Text, View } from 'react-native';
import type { GapInput, IntervalInput } from 'react-native-roster';
import type { LayerRole } from 'react-native-roster/core';
import { actualExtent, barOffsets, eventFor } from '../utils/attendance';
import { timeLabel } from '../utils/format';
import { memberMeta } from '../utils/team';
import { timeOffNote } from '../utils/time-off';
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

const HIGHLIGHT = { on: 'border-2 border-foreground', off: '' } as const;

/** A booked event: colored by kind, labeled when wide enough. */
export function EventCard({
  rect,
  lane,
  highlighted,
  timezone,
}: IntervalInput & { timezone: string }) {
  const source = rect.sources[0];
  const event = eventFor({ rect, lane });
  const actual = event ? actualExtent(event) : null;
  const bar = actual && event ? barOffsets(actual, event, rect.width) : null;
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
      className={`overflow-visible justify-center rounded-md border px-1.5 ${kind.card} ${HIGHLIGHT[highlighted ? 'on' : 'off']}`}
    >
      {label}
      {clock}
      {bar ? (
        <View
          testID="team-attendance-strip"
          className={`absolute bottom-0 h-1 ${kind.dot}`}
          style={bar}
        />
      ) : null}
    </View>
  );
}

export const TeamTimezone = createContext('UTC');

const ROLE_COMPONENTS: Record<LayerRole, ComponentType<IntervalInput & { timezone: string }>> = {
  availability: AvailabilityBand,
  booking: EventCard,
  custom: AvailabilityBand,
};

/** One interval component for both projections; the layer role selects the part. */
export function TeamInterval(input: IntervalInput) {
  const timezone = useContext(TeamTimezone);
  const Component = ROLE_COMPONENTS[input.layer.role];
  return <Component {...input} timezone={timezone} />;
}

const GAP = {
  wholeDay: 'border border-dashed border-grid-strong bg-muted/60',
  partial: 'bg-background/70',
} as const;

/** Removed time inside working hours: lunch and out-of-office days. */
export function TimeOffGap({ rect }: GapInput) {
  const source = rect.sources[0];
  const wholeDay = rect.width >= 200;
  const label = wholeDay ? (
    <Text
      numberOfLines={1}
      className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
    >
      {timeOffNote(source) ?? 'Out of office'}
    </Text>
  ) : null;
  return (
    <View
      pointerEvents="none"
      className={`flex-1 items-center justify-center rounded-md ${GAP[wholeDay ? 'wholeDay' : 'partial']}`}
    >
      {label}
    </View>
  );
}
