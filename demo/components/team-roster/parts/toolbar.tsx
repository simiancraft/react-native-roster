import { Link } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { SortKey, SpanKey, TeamRosterModel } from '../use-team-roster';
import { VIEW_TIMEZONES } from '../use-team-roster';
import { rangeLabel, zoneShort } from '../utils/format';

const SORT_LABELS: Record<SortKey, string> = {
  name: 'Name',
  availability: 'Most hours',
  free: 'Most free',
};

export function TeamToolbar({
  window,
  timezone,
  lanes,
  members,
  query,
  sort,
  span,
  setSpan,
  setQuery,
  setSort,
  goPrev,
  goNext,
  goToday,
  setTimezone,
}: TeamRosterModel) {
  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap items-end justify-between gap-3">
        <View className="gap-1">
          <Link href="/" className="text-xs font-medium text-zinc-500">
            ← Gallery
          </Link>
          <Text accessibilityRole="header" className="text-2xl font-semibold text-zinc-50">
            Team availability
          </Text>
          <Text className="text-sm text-zinc-400">
            {rangeLabel(window.start, window.end, timezone)} · {lanes.length} of {members.length}{' '}
            people · viewed in {zoneShort(timezone)}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <ChipGroup label="Span">
            {(['day', 'week'] as SpanKey[]).map((key) => (
              <Chip
                key={key}
                label={key === 'day' ? 'Day' : 'Week'}
                selected={key === span}
                onPress={() => setSpan(key)}
              />
            ))}
          </ChipGroup>
          <NavButton label="‹" accessibilityLabel={`Previous ${span}`} onPress={goPrev} />
          <NavButton label="Today" accessibilityLabel="Today" onPress={goToday} />
          <NavButton label="›" accessibilityLabel={`Next ${span}`} onPress={goNext} />
        </View>
      </View>
      <View className="flex-row flex-wrap items-center gap-2">
        <TextInput
          accessibilityLabel="Filter people"
          placeholder="Filter by name, role, or team"
          placeholderTextColor="#71717a"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          className="h-9 min-w-[240px] rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
        />
        <ChipGroup label="Zone">
          {VIEW_TIMEZONES.map((zone) => (
            <Chip
              key={zone}
              label={zoneShort(zone)}
              selected={zone === timezone}
              onPress={() => setTimezone(zone)}
            />
          ))}
        </ChipGroup>
        <ChipGroup label="Sort">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <Chip
              key={key}
              label={SORT_LABELS[key]}
              selected={key === sort}
              onPress={() => setSort(key)}
            />
          ))}
        </ChipGroup>
      </View>
    </View>
  );
}

function NavButton({
  label,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className="h-9 min-w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-3 active:bg-zinc-800"
    >
      <Text className="text-sm font-medium text-zinc-100">{label}</Text>
    </Pressable>
  );
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
      <Text className="px-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={
        selected
          ? 'h-7 items-center justify-center rounded-md bg-zinc-100 px-2.5'
          : 'h-7 items-center justify-center rounded-md px-2.5 active:bg-zinc-800'
      }
    >
      <Text className={selected ? 'text-xs font-medium text-zinc-900' : 'text-xs text-zinc-300'}>
        {label}
      </Text>
    </Pressable>
  );
}
