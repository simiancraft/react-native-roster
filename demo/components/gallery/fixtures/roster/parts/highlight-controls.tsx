import { View } from 'react-native';
import { Control } from '../../parts/control';

/** Highlight the fixture's rule with a fresh source object, or clear it. */
export function HighlightControls({
  active,
  onHighlight,
  onClear,
}: {
  active: boolean;
  onHighlight: () => void;
  onClear: () => void;
}) {
  return (
    <View className="flex-row gap-2">
      <Control label="Highlight rule (fresh source)" selected={active} onPress={onHighlight} />
      <Control label="Clear highlight" onPress={onClear} />
    </View>
  );
}
