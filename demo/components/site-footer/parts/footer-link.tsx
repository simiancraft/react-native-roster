import { Linking, Pressable, Text } from 'react-native';
import { Glyph } from './glyph';
import type { GlyphName } from './glyph.types';

type FooterLinkProps = {
  /** Where the link goes; opens outside the demo. */
  href: string;
  /** Spoken name, since the mark itself carries no text on web. */
  label: string;
  /** The mark to draw. */
  glyph: GlyphName;
};

export function FooterLink({ href, label, glyph }: FooterLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => Linking.openURL(href)}
      className="opacity-70 hover:opacity-100"
    >
      <Text className="text-foreground">
        <Glyph name={glyph} />
      </Text>
    </Pressable>
  );
}
