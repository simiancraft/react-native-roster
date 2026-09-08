import { Pressable, Text, View } from 'react-native';
import { next, prev } from 'react-native-roster/core';
import type { useGalleryRoute } from '../use-gallery-route';

type ControlsInput = ReturnType<typeof useGalleryRoute>;

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
}: ControlsInput) {
  return (
    <View style={{ gap: 8 }}>
      <Text
        accessibilityRole="header"
        style={{ fontSize: 24, fontWeight: '600', color: '#0f172a' }}
      >
        {fixture.title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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
        {(['UTC', 'America/Chicago', 'Pacific/Auckland'] as const).map((timezone) => (
          <Control
            key={timezone}
            label={timezone}
            selected={timezone === windowSpec.timezone}
            onPress={() => setTimezone(timezone)}
          />
        ))}
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
