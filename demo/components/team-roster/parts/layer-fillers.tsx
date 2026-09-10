import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import type { GapInput, IntervalInput } from 'react-native-roster';
import type { LayerRole } from 'react-native-roster/core';
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
  const { events } = memberMeta(lane);
  const event = events.find((candidate) => candidate.id === source?.id);
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
      className={`justify-center rounded-md border px-1.5 ${kind.card} ${HIGHLIGHT[highlighted ? 'on' : 'off']}`}
    >
      {label}
      {clock}
    </View>
  );
}

const ROLE_FILLERS: Record<LayerRole, (input: IntervalInput, timezone: string) => ReactNode> = {
  availability: (input) => <AvailabilityBand {...input} />,
  booking: (input, timezone) => <EventCard {...input} timezone={timezone} />,
  custom: (input) => <AvailabilityBand {...input} />,
};

/** One interval filler for both projections; the layer role picks the part. */
export function intervalFillerFor(timezone: string) {
  return (input: IntervalInput) => ROLE_FILLERS[input.layer.role](input, timezone);
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
