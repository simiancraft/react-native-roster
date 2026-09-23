import { Text, View } from 'react-native';
import { Card } from '../../../ui/card';
import type { LinkComponent } from '../home.types';

export type FixtureCardInput = { id: string; href: string; title: string; description?: string };

export function FixtureSection({
  title,
  blurb,
  fixtures,
  linkComponent,
}: {
  title: string;
  blurb: string;
  fixtures: FixtureCardInput[];
  /** Wraps each fixture card in the host's link element. */
  linkComponent: LinkComponent;
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
            linkComponent={linkComponent}
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
  linkComponent,
}: Omit<FixtureCardInput, 'id'> & {
  /** Wraps this card in the host's link element. */
  linkComponent: LinkComponent;
}) {
  const detail = description ? (
    <Text numberOfLines={2} className="text-xs leading-4 text-muted-foreground">
      {description}
    </Text>
  ) : null;
  const card = (
    <Card
      accessibilityRole="link"
      className="w-full gap-1 rounded-xl border border-border bg-card/60 p-4 sm:w-[calc(50%-6px)] lg:w-[calc(33.333%-8px)] web:cursor-pointer web:transition-colors web:hover:border-grid-strong web:hover:bg-card"
      contentZone={
        <>
          <Text className="text-sm font-medium text-foreground">{title}</Text>
          <Text className="font-mono text-[10px] text-muted-foreground">{href}</Text>
          {detail}
        </>
      }
    />
  );
  const Link = linkComponent;
  return <Link href={href} cardZone={card} />;
}
