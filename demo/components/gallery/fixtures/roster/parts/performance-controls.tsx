import { View } from 'react-native';
import { Control } from '../../parts/control';

/** Workload W actions: a cold layout measurement and two single-body edits. */
export function PerformanceControls({
  onMeasureColdLayout,
  onChangeRule,
  onChangeLaneTimezone,
}: {
  onMeasureColdLayout: () => void;
  onChangeRule: () => void;
  onChangeLaneTimezone: () => void;
}) {
  return (
    <View className="flex-row gap-2">
      <Control label="Measure cold layout" onPress={onMeasureColdLayout} />
      <Control label="Change rule hours" onPress={onChangeRule} />
      <Control label="Change last lane zone" onPress={onChangeLaneTimezone} />
    </View>
  );
}
