import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Eyebrow } from '../../ui/eyebrow';
import { Toggle } from '../../ui/toggle';

type ChipGroupProps = {
  label: string;
  /** Ordered chips; the group supplies the legend, border, and horizontal spacing. */
  chipsZone: ReactNode;
};

/** A bordered group whose caption sits on the top border, the way a fieldset legend does. */
export function ChipGroup({ label, chipsZone }: ChipGroupProps) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="relative flex-row items-center gap-1 rounded-lg border border-border bg-card p-1"
    >
      <Eyebrow size="compact" className="absolute -top-2 left-2 bg-background px-1">
        {label}
      </Eyebrow>
      {chipsZone}
    </View>
  );
}

const CHIP = {
  idle: {
    chip: 'h-7 items-center justify-center rounded-md px-2.5 active:bg-accent',
    text: 'text-xs text-foreground',
  },
  selected: {
    chip: 'h-7 items-center justify-center rounded-md bg-primary px-2.5',
    text: 'text-xs font-medium text-primary-foreground',
  },
} as const;

/** One exclusive choice within a chip group. */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const classes = CHIP[selected ? 'selected' : 'idle'];
  return (
    <Toggle mode="radio" checked={selected} onPress={onPress} className={classes.chip}>
      <Text className={classes.text}>{label}</Text>
    </Toggle>
  );
}

export function ToolbarButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="h-9 min-w-9 items-center justify-center rounded-lg border border-border bg-card px-3 active:bg-accent"
    >
      <Text className="text-sm font-medium text-foreground">{label}</Text>
    </Pressable>
  );
}
