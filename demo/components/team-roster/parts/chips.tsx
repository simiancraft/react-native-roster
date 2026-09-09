import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type ChipGroupProps = {
  label: string;
  /** Ordered chips; the group supplies the label, border, and horizontal spacing. */
  chipsZone: ReactNode;
};

export function ChipGroup({ label, chipsZone }: ChipGroupProps) {
  return (
    <View className="flex-row items-center gap-1 rounded-lg border border-border bg-card p-1">
      <Text className="px-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </Text>
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

/** A toggle in a group; selected is this chip's own interaction state. */
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
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={classes.chip}
    >
      <Text className={classes.text}>{label}</Text>
    </Pressable>
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
