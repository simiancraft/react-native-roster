import { Pressable, Text, View } from 'react-native';
import { next, prev } from 'react-native-roster/core';
import type { useRosterFixture } from '../use-roster-fixture';

type ControlsInput = ReturnType<typeof useRosterFixture>;

export function GalleryControls({
  fixture,
  fixtureId,
  changeRule,
  measureColdLayout,
  changeLaneTimezone,
  windowSpec,
  setWindowSpec,
  setSpan,
  setTimezone,
  minuteStep,
  setMinuteStep,
  sort,
  setSort,
  highlightSource,
  highlightRule,
  clearHighlight,
}: ControlsInput) {
  const highlightZone = fixture.highlightSource ? (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <Control
        label="Highlight rule (fresh source)"
        selected={!!highlightSource}
        onPress={highlightRule}
      />
      <Control label="Clear highlight" onPress={clearHighlight} />
    </View>
  ) : null;
  const performanceZone =
    fixtureId === '200-lanes' ? (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Control label="Measure cold layout" onPress={measureColdLayout} />
        <Control label="Change rule hours" onPress={changeRule} />
        <Control label="Change last lane zone" onPress={changeLaneTimezone} />
      </View>
    ) : null;
  return (
    <View style={{ gap: 8 }}>
      <Text
        accessibilityRole="header"
        style={{ fontSize: 24, fontWeight: '600', color: '#0f172a' }}
      >
        {fixture.title}
      </Text>
      <Text style={{ color: '#475569', fontSize: 12 }}>{fixture.description}</Text>
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

function Control({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const backgroundColor = selected ? '#c7d2fe' : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ padding: 8, borderRadius: 6, backgroundColor }}
    >
      <Text style={{ color: '#1e293b', fontSize: 12 }}>{label}</Text>
    </Pressable>
  );
}
