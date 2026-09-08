import { Pressable, Text, View } from 'react-native';
import { next, prev, today } from 'react-native-roster/core';
import type { useScheduleRoute } from '../use-schedule-route';

export function ScheduleControls(model: ReturnType<typeof useScheduleRoute>) {
  const {
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
  } = model;
  const zoneExamples = model.showsZoneExamples ? (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {(['defaults', 'replacements'] as const).map((value) => (
        <Control
          key={value}
          label={`Zones: ${value}`}
          selected={model.zoneStyle === value}
          onPress={() => model.setZoneStyle(value)}
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
  ) : null;
  return (
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={{ fontSize: 22, color: '#0f172a' }}>
        {fixture.title}
      </Text>
      {zoneExamples}
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
      style={{ padding: 6, borderRadius: 6, backgroundColor }}
    >
      <Text style={{ fontSize: 11, color: '#1e293b' }}>{label}</Text>
    </Pressable>
  );
}
