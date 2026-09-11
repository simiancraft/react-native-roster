import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { next, prev } from 'react-native-roster/core';
import { Control } from '../../parts/control';
import type { useRosterFixture } from '../use-roster-fixture';

type GalleryControlsProps = Pick<
  ReturnType<typeof useRosterFixture>,
  | 'fixture'
  | 'windowSpec'
  | 'setWindowSpec'
  | 'setSpan'
  | 'setTimezone'
  | 'minuteStep'
  | 'setMinuteStep'
  | 'sort'
  | 'setSort'
> & {
  /** Highlight actions; the chassis supplies them when the fixture names a highlight source. */
  highlightZone: ReactNode;
  /** Workload actions; the chassis supplies them for workload fixtures. */
  performanceZone: ReactNode;
};

export function GalleryControls({
  fixture,
  windowSpec,
  setWindowSpec,
  setSpan,
  setTimezone,
  minuteStep,
  setMinuteStep,
  sort,
  setSort,
  highlightZone,
  performanceZone,
}: GalleryControlsProps) {
  return (
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" className="text-2xl font-semibold text-foreground">
        {fixture.title}
      </Text>
      <Text className="text-xs text-muted-foreground">{fixture.description}</Text>
      {highlightZone}
      {performanceZone}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {fixture.windowPresets?.map((preset) => (
          <Control
            key={preset.label}
            label={preset.label}
            onPress={() => setWindowSpec({ ...preset.windowSpec, timezone: windowSpec.timezone })}
          />
        ))}
        <Control label="Previous" onPress={() => setWindowSpec(prev(windowSpec))} />
        <Control label="Next" onPress={() => setWindowSpec(next(windowSpec))} />
        {(['day', 'week', 'month'] as const).map((span) => (
          <Control
            key={span}
            label={span}
            selected={span === windowSpec.span}
            onPress={() => setSpan(span)}
          />
        ))}
        {([15, 30, 60] as const).map((step) => (
          <Control
            key={step}
            label={`${step} min`}
            selected={step === minuteStep}
            onPress={() => setMinuteStep(step)}
          />
        ))}
        {(['UTC', 'America/Chicago', 'Europe/London', 'Pacific/Auckland'] as const).map(
          (timezone) => (
            <Control
              key={timezone}
              label={timezone}
              selected={timezone === windowSpec.timezone}
              onPress={() => setTimezone(timezone)}
            />
          ),
        )}
        {(['label', 'availability', 'availabilityMinusBooking'] as const).map((measure) => (
          <Control
            key={measure}
            label={`Sort: ${measure}`}
            selected={measure === sort}
            onPress={() => setSort(measure)}
          />
        ))}
      </View>
    </View>
  );
}
