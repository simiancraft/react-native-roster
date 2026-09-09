import { Pressable, Text, View } from 'react-native';
import type { LaneLabelInput } from 'react-native-roster';
import { zoneShort } from '../utils/format';
import { memberMeta } from '../utils/team';
import { TONE_CLASSES } from '../utils/tones';

type MemberLabelProps = LaneLabelInput & {
  variant: 'idle' | 'selected';
  onPress: () => void;
};

const ROW_CLASSES: Record<MemberLabelProps['variant'], string> = {
  idle: 'flex-1 flex-row items-center gap-3 border-b border-zinc-800/80 px-3 active:bg-zinc-800/60',
  selected:
    'flex-1 flex-row items-center gap-3 border-b border-zinc-800/80 border-l-2 border-l-zinc-100 bg-zinc-800/70 px-3',
};

export function MemberLabel({ lane, complete, viewTimezone, variant, onPress }: MemberLabelProps) {
  const { member } = memberMeta(lane);
  const tone = TONE_CLASSES[member.tone];
  const zone =
    member.timezone === viewTimezone ? null : (
      <Text className="text-[10px] text-zinc-500">{zoneShort(member.timezone)}</Text>
    );
  const notice = complete ? null : (
    <Text className="text-[10px] text-amber-400">Partial hours</Text>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${member.name}, ${member.role}`}
      accessibilityState={{ selected: variant === 'selected' }}
      onPress={onPress}
      className={ROW_CLASSES[variant]}
    >
      <View className={`h-8 w-8 items-center justify-center rounded-full ${tone.avatar}`}>
        <Text className={`text-xs font-semibold ${tone.avatarText}`}>{member.initials}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-[13px] font-medium text-zinc-100">
          {member.name}
        </Text>
        <Text numberOfLines={1} className="text-[11px] text-zinc-400">
          {member.role}
        </Text>
      </View>
      <View className="items-end">
        {zone}
        {notice}
      </View>
    </Pressable>
  );
}
