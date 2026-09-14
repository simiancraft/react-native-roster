import { Pressable, Text, View } from 'react-native';
import type { AttendanceMode, Attendee } from '../attendance.types';

const CHOICE_CLASSES = {
  true: { color: 'bg-primary', text: 'text-primary-foreground' },
  false: { color: 'bg-muted', text: 'text-foreground' },
};

export function AttendanceModeToggle({
  attendees,
  mode,
  onChange,
}: {
  attendees: Attendee[];
  mode: AttendanceMode;
  onChange: (mode: AttendanceMode) => void;
}) {
  const choices: { label: string; mode: AttendanceMode; selected: boolean }[] = [
    { label: 'Everyone', mode: { kind: 'everyone' }, selected: mode.kind === 'everyone' },
    ...attendees.map((attendee) => ({
      label: `Anchor: ${attendee.name}`,
      mode: { kind: 'anchor' as const, attendeeId: attendee.id },
      selected: mode.kind === 'anchor' && mode.attendeeId === attendee.id,
    })),
  ];
  return (
    <View className="gap-2">
      <Text className="text-xs font-medium text-foreground">Who matters?</Text>
      <View className="flex-row flex-wrap gap-1">
        {choices.map((choice) => {
          const { color, text } = CHOICE_CLASSES[`${choice.selected}`];
          return (
            <Pressable
              key={choice.label}
              accessibilityRole="button"
              accessibilityState={{ selected: choice.selected }}
              onPress={() => onChange(choice.mode)}
              className={`rounded-md px-2 py-2 ${color}`}
            >
              <Text className={`text-[10px] ${text}`}>{choice.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
