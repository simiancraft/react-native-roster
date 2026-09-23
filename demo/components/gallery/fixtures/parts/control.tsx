import { Pressable, Text } from 'react-native';
import { Toggle } from '../../../ui/toggle';

const STATE = {
  idle: 'rounded-md border border-border bg-card px-2.5 py-1.5 active:bg-accent',
  selected: 'rounded-md border border-primary bg-primary/15 px-2.5 py-1.5',
} as const;

/** One fixture control: a small toggle or action button shared by every fixture. */
export function Control({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const selectedState =
    selected === undefined ? {} : { accessibilityState: { selected }, 'aria-selected': selected };
  return (
    <Pressable
      accessibilityRole="button"
      {...selectedState}
      onPress={onPress}
      className={STATE[selected ? 'selected' : 'idle']}
    >
      <Text className="text-xs text-foreground">{label}</Text>
    </Pressable>
  );
}

/** One persistent fixture choice with pressed-toggle semantics. */
export function ToggleControl({
  label,
  pressed,
  onPress,
}: {
  label: string;
  pressed: boolean;
  onPress: () => void;
}) {
  return (
    <Toggle
      mode="pressed"
      pressed={pressed}
      onPress={onPress}
      className={STATE[pressed ? 'selected' : 'idle']}
    >
      <Text className="text-xs text-foreground">{label}</Text>
    </Toggle>
  );
}
