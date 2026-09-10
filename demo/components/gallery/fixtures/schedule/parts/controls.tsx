import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { next, prev } from 'react-native-roster/core';
import { Control } from '../../parts/control';
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
        {(['day', 'week'] as const).map((span) => (
          <Control
            key={span}
            label={span}
            selected={span === windowSpec.span}
            onPress={() => setSpan(span)}
          />
        ))}
        {[15, 30, 60].map((step) => (
          <Control
            key={step}
            label={`${step} min`}
            selected={step === minuteStep}
            onPress={() => setMinuteStep(step)}
          />
        ))}
        {[32, 48, 64].map((scale) => (
          <Control
            key={scale}
            label={`${scale} px/hour`}
            selected={scale === pxPerHour}
            onPress={() => setPxPerHour(scale)}
          />
        ))}
        {['UTC', 'America/Chicago', 'Pacific/Auckland', 'Australia/Lord_Howe', 'Pacific/Apia'].map(
          (timezone) => (
            <Control
              key={timezone}
              label={timezone}
              selected={timezone === windowSpec.timezone}
              onPress={() => setTimezone(timezone)}
            />
          ),
        )}
        {(['roster', 'schedule', 'both'] as const).map((value) => (
          <Control
            key={value}
            label={value}
            selected={value === view}
            onPress={() => setView(value)}
          />
        ))}
      </View>
    </View>
  );
}
