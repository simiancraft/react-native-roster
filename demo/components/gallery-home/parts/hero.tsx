import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export function GalleryHero({ version }: { version: string }) {
  return (
    <View className="gap-6">
      <View className="gap-3">
        <View className="flex-row items-center gap-2">
          <Text className="font-mono text-xs text-zinc-500">react-native-roster</Text>
          <Text className="rounded-full border border-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
            v{version}
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          className="text-4xl font-semibold tracking-tight text-zinc-50"
        >
          Lanes, layers, and sources on one time axis.
        </Text>
        <Text className="max-w-[640px] text-base leading-6 text-zinc-400">
          Layered absolute intervals with provenance for React Native. Roster projects many lanes
          across a shared window; Schedule projects one lane into day columns. Every visual region
          is a zone, and every chrome region takes a className.
        </Text>
      </View>
      <Link href="/showcase" asChild>
        <View
          accessibilityRole="link"
          className="gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 web:cursor-pointer web:transition-colors web:hover:border-zinc-600"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-[11px] font-medium uppercase tracking-wide text-emerald-400">
              Showcase
            </Text>
            <Text className="text-xs text-zinc-500">NativeWind · Faker · rrule adapter</Text>
          </View>
          <Text className="text-xl font-semibold text-zinc-50">Team availability</Text>
          <Text className="text-sm leading-5 text-zinc-400">
            Twelve generated people across seven time zones, weekly working hours from recurrence
            rules, lunch and out-of-office exclusions, and booked events. Press a person to open
            their week as a Schedule.
          </Text>
          <View className="flex-row gap-1.5">
            <Swatch className="bg-emerald-500/40" />
            <Swatch className="bg-sky-500" />
            <Swatch className="bg-violet-500" />
            <Swatch className="bg-amber-500/40" />
            <Swatch className="bg-rose-500/40" />
          </View>
        </View>
      </Link>
    </View>
  );
}

function Swatch({ className }: { className: string }) {
  return <View className={`h-2 w-10 rounded-full ${className}`} />;
}
