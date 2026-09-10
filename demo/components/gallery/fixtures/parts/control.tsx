import { Pressable, Text } from 'react-native';

const STATE = {
  idle: 'rounded-md border border-border bg-card px-2.5 py-1.5 active:bg-accent',
  selected: 'rounded-md border border-primary bg-primary/15 px-2.5 py-1.5',
} as const;

/** One fixture control: a small toggle or action button shared by every fixture. */
export function Control({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={STATE[selected ? 'selected' : 'idle']}
    >
      <Text className="text-xs text-foreground">{label}</Text>
    </Pressable>
  );
}
