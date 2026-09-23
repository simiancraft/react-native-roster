import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Toggle } from '../../../ui/toggle';

const STATE = {
  idle: 'rounded-md border border-border bg-card px-2.5 py-1.5 active:bg-accent',
  selected: 'rounded-md border border-primary bg-primary/15 px-2.5 py-1.5',
} as const;

/** One ordinary fixture action shared by every fixture. */
export function Control({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={STATE.idle}>
      <Text className="text-xs text-foreground">{label}</Text>
    </Pressable>
  );
}

/** A programmatically named set of exclusive fixture choices. */
export function RadioGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="flex-row flex-wrap gap-1.5"
    >
      {children}
    </View>
  );
}

/** One exclusive choice within a fixture radio group. */
export function RadioControl({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Toggle
      mode="radio"
      checked={checked}
      onPress={onPress}
      className={STATE[checked ? 'selected' : 'idle']}
    >
      <Text className="text-xs text-foreground">{label}</Text>
    </Toggle>
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
