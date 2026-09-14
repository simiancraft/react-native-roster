import { Text, View } from 'react-native';
import type { IntervalInput } from 'react-native-roster';
import { attendanceMeta } from '../utils/attendance';
import { clockLabel } from '../utils/format';
import { deadTime } from '../utils/overlap';
import { STATUS_COLORS } from '../utils/tones';

export function PresenceBar({ rect, lane }: IntervalInput) {
  const { presence, attendance, together, status } = attendanceMeta(lane);
  if (!presence) return null;
  const dead = deadTime(presence, together);
  const duration = presence.end - presence.start;
  const fill = STATUS_COLORS[status].fill;
  let captions = null;
  let progress = null;
  if (rect.width >= 84)
    captions = (
      <View className="absolute top-0 left-0 right-0 flex-row justify-between px-1">
        <Text className="text-[9px] font-semibold tabular-nums text-attendance-ink">
          {clockLabel(presence.start, attendance.timezone)}
        </Text>
        <Text className="text-[9px] font-semibold tabular-nums text-attendance-ink">
          {clockLabel(presence.end, attendance.timezone)}
        </Text>
      </View>
    );
  if (rect.width >= 24)
    progress = (
      <>
        <View
          testID="attendance-waiting"
          className="absolute top-3 bottom-0 left-0 items-center justify-center bg-attendance-dead-band border-r border-attendance-dead/60"
          style={{ width: (rect.width * dead.waiting) / duration }}
        >
          {(rect.width * dead.waiting) / duration >= 40 ? (
            <Text className="text-[9px] text-attendance-ink">{dead.waiting / 60_000}m wait</Text>
          ) : null}
        </View>
        <View
          testID="attendance-lingering"
          className="absolute top-3 bottom-0 right-0 items-center justify-center bg-attendance-dead-band border-l border-attendance-dead/60"
          style={{ width: (rect.width * dead.lingering) / duration }}
        >
          {(rect.width * dead.lingering) / duration >= 40 ? (
            <Text className="text-[9px] text-attendance-ink">
              {dead.lingering / 60_000}m linger
            </Text>
          ) : null}
        </View>
      </>
    );
  return (
    <View
      pointerEvents="none"
      testID={`attendance-presence-${lane.id}`}
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: rect.z,
      }}
      className={`overflow-hidden rounded-md justify-center ${fill}`}
    >
      {captions}
      {progress}
    </View>
  );
}
