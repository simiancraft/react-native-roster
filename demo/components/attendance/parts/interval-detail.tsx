import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import type { IntervalDetailInput } from 'react-native-roster';
import { attendanceMeta } from '../utils/attendance';
import { clockLabel, dateLabel, offsetLabel } from '../utils/format';
import { KIND_COLORS, STATUS_COLORS } from '../utils/tones';

export function AttendanceIntervalDetail(input: IntervalDetailInput) {
  const Component = DETAILS[input.layer.id];
  if (!Component) throw new Error(`Unknown attendance layer: ${input.layer.id}`);
  const { attendance } = attendanceMeta(input.lane);
  const kind = KIND_COLORS[attendance.kind];
  return (
    <View
      testID={`attendance-detail-${input.layer.id}`}
      className="w-[272px] overflow-hidden rounded-xl border border-border bg-card"
    >
      <View className={`${kind.fill} p-3`}>
        <Text className="font-semibold text-attendance-ink">
          {kind.label} · {attendance.title}
        </Text>
      </View>
      <View className="gap-2 p-3">
        <Component {...input} />
        <Text className="text-[10px] text-muted-foreground">
          {input.viewTimezone} · {dateLabel(attendance.plan.start, input.viewTimezone)}
        </Text>
      </View>
    </View>
  );
}

function PresenceDetail({ lane, start, end, viewTimezone }: IntervalDetailInput) {
  const { attendee, status, minutes } = attendanceMeta(lane);
  return (
    <View className="gap-1">
      <Text className="font-semibold text-foreground">
        {attendee.name} · {STATUS_COLORS[status].label}
      </Text>
      <Text className="text-xs text-foreground">
        Arrival {clockLabel(start, viewTimezone)} · Departure {clockLabel(end, viewTimezone)}
      </Text>
      <Text className="text-xs text-foreground">
        {minutes.present} min present · {minutes.together} min together · {minutes.dead} min dead
        time
      </Text>
    </View>
  );
}
function PlanDetail({ lane, start, end, viewTimezone }: IntervalDetailInput) {
  const { attendance } = attendanceMeta(lane);
  return (
    <Text className="text-sm text-foreground">
      {KIND_COLORS[attendance.kind].label}: {attendance.title}. Planned{' '}
      {clockLabel(start, viewTimezone)} to {clockLabel(end, viewTimezone)}.
    </Text>
  );
}
function TogetherDetail(input: IntervalDetailInput) {
  const { lane, start, end, viewTimezone } = input;
  const { attendance, attendee, presence } = attendanceMeta(lane);
  return (
    <View className="gap-2">
      <Text className="font-semibold text-foreground">
        {attendee.name} · Together: {clockLabel(start, viewTimezone)} to{' '}
        {clockLabel(end, viewTimezone)}
      </Text>
      <Text className="text-xs text-foreground">
        {(end - start) / 60_000} min actual · start {offsetLabel(start, attendance.plan.start)} ·
        end {offsetLabel(end, attendance.plan.end)}
      </Text>
      {presence ? (
        <PresenceDetail {...input} start={presence.start} end={presence.end} />
      ) : (
        <Text className="text-xs text-foreground">
          No arrival or departure · 0 min present · 0 min together · 0 min dead time
        </Text>
      )}
      <PlanDetail {...input} start={attendance.plan.start} end={attendance.plan.end} />
    </View>
  );
}
const DETAILS: Record<string, ComponentType<IntervalDetailInput>> = {
  plan: PlanDetail,
  presence: PresenceDetail,
  together: TogetherDetail,
};
