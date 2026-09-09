import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export type FixtureCardInput = { id: string; title: string; description?: string };

export function FixtureSection({
  title,
  blurb,
  fixtures,
}: {
  title: string;
  blurb: string;
  fixtures: FixtureCardInput[];
}) {
  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text accessibilityRole="header" className="text-lg font-semibold text-zinc-50">
          {title}
        </Text>
        <Text className="text-sm text-zinc-500">{blurb}</Text>
      </View>
      <View className="flex-row flex-wrap gap-3">
        {fixtures.map((fixture) => (
          <FixtureCard key={fixture.id} {...fixture} />
        ))}
      </View>
    </View>
  );
}

function FixtureCard({ id, title, description }: FixtureCardInput) {
  const detail = description ? (
    <Text numberOfLines={2} className="text-xs leading-4 text-zinc-500">
      {description}
    </Text>
  ) : null;
  return (
    <Link href={`/gallery/${id}`} asChild>
      <View
        accessibilityRole="link"
        className="w-full gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 sm:w-[calc(50%-6px)] lg:w-[calc(33.333%-8px)] web:cursor-pointer web:transition-colors web:hover:border-zinc-600 web:hover:bg-zinc-900"
      >
        <Text className="text-sm font-medium text-zinc-100">{title}</Text>
        <Text className="font-mono text-[10px] text-zinc-600">/gallery/{id}</Text>
        {detail}
      </View>
    </Link>
  );
}
