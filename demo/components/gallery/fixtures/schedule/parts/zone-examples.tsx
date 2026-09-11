import { View } from 'react-native';
import { today } from 'react-native-roster';
import { Control } from '../../parts/control';
import type { useScheduleFixture } from '../use-schedule-fixture';

type ZoneExamplesProps = Pick<
  ReturnType<typeof useScheduleFixture>,
  'zoneStyle' | 'windowSpec' | 'navigate'
> & {
  onZoneStyle: (value: 'defaults' | 'replacements') => void;
};

/** Zone replacements and the date presets that exercise every Schedule zone. */
export function ZoneExamples({ zoneStyle, onZoneStyle, windowSpec, navigate }: ZoneExamplesProps) {
  return (
    <View className="flex-row flex-wrap gap-1.5">
      {(['defaults', 'replacements'] as const).map((value) => (
        <Control
          key={value}
          label={`Zones: ${value}`}
          selected={zoneStyle === value}
          onPress={() => onZoneStyle(value)}
        />
      ))}
      <Control
        label="Apia skipped date"
        onPress={() =>
          navigate({ span: 'week', anchorDate: '2011-12-26', timezone: 'Pacific/Apia' })
        }
      />
      <Control
        label="Chicago spring"
        onPress={() =>
          navigate({ span: 'week', anchorDate: '2024-03-04', timezone: 'America/Chicago' })
        }
      />
      <Control
        label="Chicago fall"
        onPress={() =>
          navigate({ span: 'week', anchorDate: '2024-10-28', timezone: 'America/Chicago' })
        }
      />
      <Control label="Current week: now line" onPress={() => navigate(today(windowSpec))} />
    </View>
  );
}
