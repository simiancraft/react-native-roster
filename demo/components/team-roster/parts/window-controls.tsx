import { TextInput } from 'react-native';
import { type SortKey, type SpanKey, VIEW_TIMEZONES } from '../team-roster.types';
import { zoneShort } from '../utils/format';
import { Chip, ChipGroup, ToolbarButton } from './chips';

const SPAN_LABELS: Record<SpanKey, string> = { day: 'Day', week: 'Week' };
const SORT_LABELS: Record<SortKey, string> = {
  name: 'Name',
  availability: 'Most hours',
  free: 'Most free',
};

export function SpanChips({
  span,
  onChange,
}: {
  span: SpanKey;
  onChange: (span: SpanKey) => void;
}) {
  return (
    <ChipGroup
      label="Span"
      chipsZone={(Object.keys(SPAN_LABELS) as SpanKey[]).map((key) => (
        <Chip
          key={key}
          label={SPAN_LABELS[key]}
          selected={key === span}
          onPress={() => onChange(key)}
        />
      ))}
    />
  );
}

export function WindowNav({
  span,
  onPrev,
  onToday,
  onNext,
}: {
  span: SpanKey;
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <ToolbarButton label="‹" accessibilityLabel={`Previous ${span}`} onPress={onPrev} />
      <ToolbarButton label="Today" accessibilityLabel="Today" onPress={onToday} />
      <ToolbarButton label="›" accessibilityLabel={`Next ${span}`} onPress={onNext} />
    </>
  );
}

export function ZoneChips({
  timezone,
  onChange,
}: {
  timezone: string;
  onChange: (timezone: string) => void;
}) {
  return (
    <ChipGroup
      label="Zone"
      chipsZone={VIEW_TIMEZONES.map((zone) => (
        <Chip
          key={zone}
          label={zoneShort(zone)}
          selected={zone === timezone}
          onPress={() => onChange(zone)}
        />
      ))}
    />
  );
}

export function SortChips({
  sort,
  onChange,
}: {
  sort: SortKey;
  onChange: (sort: SortKey) => void;
}) {
  return (
    <ChipGroup
      label="Sort"
      chipsZone={(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
        <Chip
          key={key}
          label={SORT_LABELS[key]}
          selected={key === sort}
          onPress={() => onChange(key)}
        />
      ))}
    />
  );
}

export function PeopleFilter({
  query,
  onChange,
}: {
  query: string;
  onChange: (query: string) => void;
}) {
  return (
    <TextInput
      accessibilityLabel="Filter people"
      placeholder="Filter people"
      placeholderTextColor="#71717a"
      value={query}
      onChangeText={onChange}
      autoCapitalize="none"
      autoCorrect={false}
      className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground"
    />
  );
}
