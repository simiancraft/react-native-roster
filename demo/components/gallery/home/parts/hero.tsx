import { Text, View } from 'react-native';
import type { LinkZone } from '../home.types';

export function GalleryHero({
  version,
  showcaseHref,
  linkZone,
}: {
  version: string;
  showcaseHref: string;
  linkZone: LinkZone;
}) {
  const card = (
    <View
      accessibilityRole="link"
      className="gap-3 rounded-2xl border border-border bg-card p-5 web:cursor-pointer web:transition-colors web:hover:border-grid-strong"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-[11px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Showcase
        </Text>
        <Text className="text-xs text-muted-foreground">NativeWind · Faker · rrule adapter</Text>
      </View>
      <Text className="text-xl font-semibold text-foreground">Team availability</Text>
      <Text className="text-sm leading-5 text-muted-foreground">
        Twelve generated people across seven time zones, weekly working hours from recurrence rules,
        lunch and out-of-office exclusions, and booked events. Press a person to open their week as
        a Schedule.
      </Text>
      <View className="flex-row gap-1.5">
        <Swatch className="bg-emerald-500/40" />
        <Swatch className="bg-sky-500" />
        <Swatch className="bg-violet-500" />
        <Swatch className="bg-amber-500/40" />
        <Swatch className="bg-rose-500/40" />
      </View>
    </View>
  );
  return (
    <View className="gap-6">
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <Text className="font-mono text-xs text-muted-foreground">react-native-roster</Text>
          <Text className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            v{version}
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          className="text-4xl font-semibold tracking-tight text-foreground"
        >
          Lanes, layers, and sources on one time axis.
        </Text>
        <Text className="max-w-[640px] text-base leading-6 text-muted-foreground">
          Layered absolute intervals with provenance for React Native. Roster projects many lanes
          across a shared window; Schedule projects one lane into day columns. Every visual region
          is a zone, and every chrome region takes a className.
        </Text>
      </View>
      {linkZone({ href: showcaseHref, cardZone: card })}
    </View>
  );
}

function Swatch({ className }: { className: string }) {
  return <View className={`h-2 w-10 rounded-full ${className}`} />;
}
