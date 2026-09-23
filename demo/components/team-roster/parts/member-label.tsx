import { cva } from 'class-variance-authority';
import type { ComponentType } from 'react';
import { Text, View } from 'react-native';
import type { LaneLabelInput } from 'react-native-roster';
import { Toggle } from '../../ui/toggle';
import { cn } from '../../ui/utils/classes';
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

const rowVariants = cva('flex-1 flex-row items-center border-b border-border', {
  variants: {
    density: {
      full: 'gap-3 px-3',
      compact: 'gap-3 px-3',
      avatar: 'justify-center',
    },
    variant: {
      idle: 'active:bg-accent/60',
      selected: 'border-l-2 border-l-primary bg-accent/70',
    },
  },
});

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
  const Detail = DETAIL[density];
  const tone = TONE_CLASSES[member.tone];
  return (
    <Toggle
      mode="pressed"
      pressed={variant === 'selected'}
      accessibilityLabel={`${member.name}, ${member.role}`}
      onPress={onPress}
      className={rowVariants({ density, variant })}
    >
      <View className={cn('h-8 w-8 items-center justify-center rounded-full', tone.avatar)}>
        <Text className={cn('text-xs font-semibold', tone.avatarText)}>{member.initials}</Text>
      </View>
      <Detail member={member} complete={complete} viewTimezone={viewTimezone} />
    </Toggle>
  );
}

type DetailInput = { member: Member; complete: boolean; viewTimezone: string };

const DETAIL: Record<Density, ComponentType<DetailInput>> = {
  full: function FullDetail({ member, complete, viewTimezone }) {
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
  compact: function CompactDetail({ member }) {
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
  avatar: function AvatarDetail() {
    return null;
  },
};
