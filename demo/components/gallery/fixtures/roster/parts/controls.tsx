import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { next, prev } from 'react-native-roster/core';
import { Control, RadioControl, RadioGroup } from '../../parts/control';
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
  /** Current-time toggle supplied by the fixture chassis. */
  nowZone: ReactNode;
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
  nowZone,
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
        {nowZone}
        <Control label="Previous" onPress={() => setWindowSpec(prev(windowSpec))} />
        <Control label="Next" onPress={() => setWindowSpec(next(windowSpec))} />
        <RadioGroup label="Span">
          {(['day', 'week', 'month'] as const).map((span) => (
            <RadioControl
              key={span}
              label={span}
              checked={span === windowSpec.span}
              onPress={() => setSpan(span)}
            />
          ))}
        </RadioGroup>
        <RadioGroup label="Minute step">
          {([15, 30, 60] as const).map((step) => (
            <RadioControl
              key={step}
              label={`${step} min`}
              checked={step === minuteStep}
              onPress={() => setMinuteStep(step)}
            />
          ))}
        </RadioGroup>
        <RadioGroup label="Timezone">
          {(['UTC', 'America/Chicago', 'Europe/London', 'Pacific/Auckland'] as const).map(
            (timezone) => (
              <RadioControl
                key={timezone}
                label={timezone}
                checked={timezone === windowSpec.timezone}
                onPress={() => setTimezone(timezone)}
              />
            ),
          )}
        </RadioGroup>
        <RadioGroup label="Sort">
          {(['label', 'availability', 'availabilityMinusBooking'] as const).map((measure) => (
            <RadioControl
              key={measure}
              label={`Sort: ${measure}`}
              checked={measure === sort}
              onPress={() => setSort(measure)}
            />
          ))}
        </RadioGroup>
      </View>
    </View>
  );
}
