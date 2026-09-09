import { Text, View } from 'react-native';
import type { GapInput, IntervalInput } from 'react-native-roster';
import { timeLabel } from '../utils/format';
import { memberMeta } from '../utils/team';
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
      className={`justify-center rounded-md border px-1.5 ${kind.card} ${highlighted ? 'border-2 border-white' : ''}`}
    >
      {label}
      {clock}
    </View>
  );
}

/** Removed time inside working hours: lunch and out-of-office days. */
export function TimeOffGap({ rect }: GapInput) {
  const source = rect.sources[0];
  const wholeDay = rect.width >= 200;
  const label = wholeDay ? (
    <Text
      numberOfLines={1}
      className="text-[10px] font-medium uppercase tracking-wide text-zinc-500"
    >
      {source?.kind === 'rule' ? 'Lunch' : (source?.label ?? 'Out of office')}
    </Text>
  ) : null;
  return (
    <View
      pointerEvents="none"
      className={`flex-1 items-center justify-center rounded-md ${wholeDay ? 'border border-dashed border-zinc-700 bg-zinc-900/60' : 'bg-zinc-950/70'}`}
    >
      {label}
    </View>
  );
}
