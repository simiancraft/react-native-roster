import { Text, View } from 'react-native';
import type { LinkZone } from '../home.types';

export type FixtureCardInput = { id: string; href: string; title: string; description?: string };

export function FixtureSection({
  title,
  blurb,
  fixtures,
  linkZone,
}: {
  title: string;
  blurb: string;
  fixtures: FixtureCardInput[];
  /** Wraps each fixture card in the host's link element. */
  linkZone: LinkZone;
}) {
  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text accessibilityRole="header" className="text-lg font-semibold text-foreground">
          {title}
        </Text>
        <Text className="text-sm text-muted-foreground">{blurb}</Text>
      </View>
      <View className="flex-row flex-wrap gap-3">
        {fixtures.map((fixture) => (
          <FixtureCard
            key={fixture.id}
            href={fixture.href}
            title={fixture.title}
            description={fixture.description}
            linkZone={linkZone}
          />
        ))}
      </View>
    </View>
  );
}

function FixtureCard({
  href,
  title,
  description,
  linkZone,
}: Omit<FixtureCardInput, 'id'> & {
  /** Wraps this card in the host's link element. */
  linkZone: LinkZone;
}) {
  const detail = description ? (
    <Text numberOfLines={2} className="text-xs leading-4 text-muted-foreground">
      {description}
    </Text>
  ) : null;
  const card = (
    <View
      accessibilityRole="link"
      className="w-full gap-1 rounded-xl border border-border bg-card/60 p-4 sm:w-[calc(50%-6px)] lg:w-[calc(33.333%-8px)] web:cursor-pointer web:transition-colors web:hover:border-grid-strong web:hover:bg-card"
    >
      <Text className="text-sm font-medium text-foreground">{title}</Text>
      <Text className="font-mono text-[10px] text-muted-foreground">{href}</Text>
      {detail}
    </View>
  );
  return linkZone({ href, cardZone: card });
}
