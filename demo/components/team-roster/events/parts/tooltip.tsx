import { Text, View } from 'react-native';

/** Mounted above its row's bar, within the existing detail popover. */
export function AttendanceTooltip({ text }: { text: string }) {
  return (
    <View
      testID="attendance-tooltip"
      pointerEvents="none"
      className="absolute bottom-[12px] left-0 right-0 z-20 rounded border border-border bg-background px-2 py-1"
    >
      <Text className="text-[10px] text-foreground">{text}</Text>
    </View>
  );
}
