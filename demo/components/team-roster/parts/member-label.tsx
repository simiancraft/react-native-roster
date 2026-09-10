import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { LaneLabelInput } from 'react-native-roster';
import type { Member } from '../members/member.types';
import type { Density } from '../team-roster.types';
import { zoneShort } from '../utils/format';
import { memberMeta } from '../utils/team';
import { TONE_CLASSES } from '../utils/tones';

export type MemberLabelProps = LaneLabelInput & {
  density: Density;
  variant: 'idle' | 'selected';
  onPress: () => void;
};

const ROW: Record<MemberLabelProps['variant'], Record<Density, string>> = {
  idle: {
    full: 'flex-1 flex-row items-center gap-3 border-b border-border px-3 active:bg-accent/60',
    compact: 'flex-1 flex-row items-center gap-3 border-b border-border px-3 active:bg-accent/60',
    avatar:
      'flex-1 flex-row items-center justify-center border-b border-border active:bg-accent/60',
  },
  selected: {
    full: 'flex-1 flex-row items-center gap-3 border-b border-border border-l-2 border-l-primary bg-accent/70 px-3',
    compact:
      'flex-1 flex-row items-center gap-3 border-b border-border border-l-2 border-l-primary bg-accent/70 px-3',
    avatar:
      'flex-1 flex-row items-center justify-center border-b border-border border-l-2 border-l-primary bg-accent/70',
  },
};

/** One person beside their lane; density decides how much of them shows. */
export function MemberLabel({
  lane,
  complete,
  viewTimezone,
  density,
  variant,
  onPress,
}: MemberLabelProps) {
  const { member } = memberMeta(lane);
  const tone = TONE_CLASSES[member.tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${member.name}, ${member.role}`}
      accessibilityState={{ selected: variant === 'selected' }}
      onPress={onPress}
      className={ROW[variant][density]}
    >
      <View className={`h-8 w-8 items-center justify-center rounded-full ${tone.avatar}`}>
        <Text className={`text-xs font-semibold ${tone.avatarText}`}>{member.initials}</Text>
      </View>
      {DETAIL[density]({ member, complete, viewTimezone })}
    </Pressable>
  );
}

type DetailInput = { member: Member; complete: boolean; viewTimezone: string };

const DETAIL: Record<Density, (input: DetailInput) => ReactNode> = {
  full: ({ member, complete, viewTimezone }) => {
    const zone =
      member.timezone === viewTimezone ? null : (
        <Text className="text-[10px] text-muted-foreground">{zoneShort(member.timezone)}</Text>
      );
    const notice = complete ? null : (
      <Text className="text-[10px] text-amber-700 dark:text-amber-400">Partial hours</Text>
    );
    return (
      <>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-[13px] font-medium text-foreground">
            {member.name}
          </Text>
          <Text numberOfLines={1} className="text-[11px] text-muted-foreground">
            {member.role}
          </Text>
        </View>
        <View className="items-end">
          {zone}
          {notice}
        </View>
      </>
    );
  },
  compact: ({ member }) => {
    const [first, ...rest] = member.name.split(' ');
    return (
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-[12px] font-medium leading-4 text-foreground">
          {first}
        </Text>
        <Text numberOfLines={1} className="text-[12px] leading-4 text-muted-foreground">
          {rest.join(' ')}
        </Text>
      </View>
    );
  },
  avatar: () => null,
};
