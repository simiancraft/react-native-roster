import { Text, View } from 'react-native';
import { TONE_CLASSES } from '../../utils/tones';
import type { Member } from '../member.types';

export function MemberIdentity({ member }: { member: Member }) {
  const tone = TONE_CLASSES[member.tone];
  return (
    <View className="flex-row items-center gap-3">
      <View className={`h-11 w-11 items-center justify-center rounded-full ${tone.avatar}`}>
        <Text className={`text-sm font-semibold ${tone.avatarText}`}>{member.initials}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="text-base font-semibold text-foreground">
          {member.name}
        </Text>
        <Text numberOfLines={1} className="text-xs text-muted-foreground">
          {member.role} · {member.team}
        </Text>
      </View>
    </View>
  );
}

export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-md bg-muted px-2 py-1">
      <Text className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</Text>
      <Text className="text-xs text-foreground">{value}</Text>
    </View>
  );
}
