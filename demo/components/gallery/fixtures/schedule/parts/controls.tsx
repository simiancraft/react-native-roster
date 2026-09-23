import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { next, prev } from 'react-native-roster/core';
import { Control, RadioControl, RadioGroup } from '../../parts/control';
import type { useScheduleFixture } from '../use-schedule-fixture';

type ScheduleControlsProps = Pick<
  ReturnType<typeof useScheduleFixture>,
  | 'fixture'
  | 'windowSpec'
  | 'navigate'
  | 'setSpan'
  | 'minuteStep'
  | 'setMinuteStep'
  | 'pxPerHour'
  | 'setPxPerHour'
  | 'setTimezone'
  | 'view'
  | 'setView'
> & {
  /** Zone replacements and date presets; the chassis supplies them only for the every-zone fixture. */
  zoneExamplesZone: ReactNode;
};

export function ScheduleControls({
  fixture,
  windowSpec,
  navigate,
  setSpan,
  minuteStep,
  setMinuteStep,
  pxPerHour,
  setPxPerHour,
  setTimezone,
  view,
  setView,
  zoneExamplesZone,
}: ScheduleControlsProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" className="text-2xl font-semibold text-foreground">
        {fixture.title}
      </Text>
      {zoneExamplesZone}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        <Control label="Previous" onPress={() => navigate(prev(windowSpec))} />
        <Control label="Next" onPress={() => navigate(next(windowSpec))} />
        <RadioGroup label="Span">
          {(['day', 'week'] as const).map((span) => (
            <RadioControl
              key={span}
              label={span}
              checked={span === windowSpec.span}
              onPress={() => setSpan(span)}
            />
          ))}
        </RadioGroup>
        <RadioGroup label="Minute step">
          {[15, 30, 60].map((step) => (
            <RadioControl
              key={step}
              label={`${step} min`}
              checked={step === minuteStep}
              onPress={() => setMinuteStep(step)}
            />
          ))}
        </RadioGroup>
        <RadioGroup label="Scale">
          {[32, 48, 64].map((scale) => (
            <RadioControl
              key={scale}
              label={`${scale} px/hour`}
              checked={scale === pxPerHour}
              onPress={() => setPxPerHour(scale)}
            />
          ))}
        </RadioGroup>
        <RadioGroup label="Timezone">
          {[
            'UTC',
            'America/Chicago',
            'Pacific/Auckland',
            'Australia/Lord_Howe',
            'Pacific/Apia',
          ].map((timezone) => (
            <RadioControl
              key={timezone}
              label={timezone}
              checked={timezone === windowSpec.timezone}
              onPress={() => setTimezone(timezone)}
            />
          ))}
        </RadioGroup>
        <RadioGroup label="View">
          {(['roster', 'schedule', 'both'] as const).map((value) => (
            <RadioControl
              key={value}
              label={value}
              checked={value === view}
              onPress={() => setView(value)}
            />
          ))}
        </RadioGroup>
      </View>
    </View>
  );
}
