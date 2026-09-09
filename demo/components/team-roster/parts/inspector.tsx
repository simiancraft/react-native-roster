import { Text, View } from 'react-native';
import { Schedule, type ScheduleWindowSpec } from 'react-native-roster';
import type { Lane } from 'react-native-roster/core';
import type { Selection } from '../use-team-roster';
import { dayLabel, durationLabel, hoursLabel, timeLabel, zoneShort } from '../utils/format';
import type { Member } from '../utils/team';
import { eventKindOf, KIND_CLASSES, TONE_CLASSES } from '../utils/tones';
import { AvailabilityBand, EventCard, TimeOffGap } from './interval';

export function MemberInspector({
  lane,
  member,
  selection,
  windowSpec,
}: {
  lane: Lane;
  member: Member;
  selection: Selection;
  windowSpec: ScheduleWindowSpec;
}) {
  const tone = TONE_CLASSES[member.tone];
  const timezone = windowSpec.timezone;
  return (
    <View className="flex-1 min-h-0 gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <View className="flex-row items-center gap-3">
        <View className={`h-11 w-11 items-center justify-center rounded-full ${tone.avatar}`}>
          <Text className={`text-sm font-semibold ${tone.avatarText}`}>{member.initials}</Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-base font-semibold text-zinc-50">
            {member.name}
          </Text>
          <Text numberOfLines={1} className="text-xs text-zinc-400">
            {member.role} · {member.team}
          </Text>
        </View>
      </View>
      <View className="flex-row flex-wrap gap-2">
        <Fact label="Hours" value={hoursLabel(member.hours)} />
        <Fact label="Zone" value={zoneShort(member.timezone)} />
        <Fact label="Days" value={`${member.workdays.length}/wk`} />
      </View>
      <SelectionCard selection={selection} timezone={timezone} />
      <Schedule
        lane={lane}
        windowSpec={{ ...windowSpec, span: 'week' }}
        pxPerHour={28}
        className="flex-1 min-h-0 rounded-lg border border-zinc-800 bg-zinc-950"
        headerClassName="border-b border-zinc-800 bg-zinc-900/60"
        gutterClassName="bg-zinc-900/60"
        gutterZone={({ hours, pxPerHour }) => (
          <View>
            {hours.map((hour) => (
              <View key={hour} style={{ height: pxPerHour }} className="items-end pr-1">
                <Text className="text-[9px] text-zinc-500">{String(hour).padStart(2, '0')}</Text>
              </View>
            ))}
          </View>
        )}
        gridZone={({ hours, pxPerHour }) => (
          <View pointerEvents="none" className="absolute w-full">
            {hours.map((hour) => (
              <View
                key={hour}
                style={{ height: pxPerHour }}
                className="border-t border-r border-zinc-800/70"
              />
            ))}
          </View>
        )}
        dayHeaderZone={({ day }) => (
          <View className="items-center py-1">
            <Text className="text-[10px] font-medium text-zinc-300">{day.label.slice(0, 3)}</Text>
            <Text className="text-[9px] text-zinc-500">{day.localDate.slice(8)}</Text>
          </View>
        )}
        intervalZone={(input) =>
          input.layer.role === 'booking' ? (
            <EventCard {...input} timezone={timezone} />
          ) : (
            <AvailabilityBand {...input} />
          )
        }
        gapZone={TimeOffGap}
        nowLineZone={({ y }) => (
          <View
            pointerEvents="none"
            style={{ top: y }}
            className="absolute left-0 right-0 h-0.5 bg-rose-500"
          />
        )}
      />
    </View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-md bg-zinc-800/80 px-2 py-1">
      <Text className="text-[9px] uppercase tracking-wide text-zinc-500">{label}</Text>
      <Text className="text-xs text-zinc-100">{value}</Text>
    </View>
  );
}

function SelectionCard({ selection, timezone }: { selection: Selection; timezone: string }) {
  if (selection.kind === 'event') {
    const kind = KIND_CLASSES[eventKindOf(selection.event.kind)];
    return (
      <View className="gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <View className="flex-row items-center gap-2">
          <View className={`h-2 w-2 rounded-full ${kind.dot}`} />
          <Text className="text-[10px] uppercase tracking-wide text-zinc-500">{kind.label}</Text>
        </View>
        <Text className="text-sm font-medium text-zinc-50">{selection.event.title}</Text>
        <Text className="text-xs text-zinc-400">
          {dayLabel(selection.event.start, timezone)} · {timeLabel(selection.event.start, timezone)}{' '}
          to {timeLabel(selection.event.end, timezone)} ·{' '}
          {durationLabel(selection.event.start, selection.event.end)}
        </Text>
      </View>
    );
  }
  if (selection.kind === 'timeOff')
    return (
      <View className="gap-1 rounded-lg border border-dashed border-zinc-700 bg-zinc-950 p-3">
        <Text className="text-[10px] uppercase tracking-wide text-zinc-500">Time off</Text>
        <Text className="text-sm font-medium text-zinc-50">{selection.note}</Text>
      </View>
    );
  if (selection.kind === 'slot')
    return (
      <View className="gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
        <Text className="text-[10px] uppercase tracking-wide text-zinc-500">Open slot</Text>
        <Text className="text-sm font-medium text-zinc-50">
          {dayLabel(selection.time, timezone)} · {timeLabel(selection.time, timezone)}
        </Text>
        <Text className="text-xs text-zinc-400">Snapped to the hour.</Text>
      </View>
    );
  return (
    <View className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
      <Text className="text-xs text-zinc-500">Press an event or an open slot in the roster.</Text>
    </View>
  );
}
