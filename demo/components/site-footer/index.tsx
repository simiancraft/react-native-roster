import { Linking, Pressable, Text, View } from 'react-native';
import { FooterLink } from './parts/footer-link';
import { Glyph } from './parts/glyph';

const REPO = 'https://github.com/simiancraft/react-native-roster';

type SiteFooterProps = {
  /** `full` stacks the links, NOTICE pointer, and credit for a scrolling page; `compact` is one row under a bounded fixture. */
  density?: 'full' | 'compact';
};

const CREDIT = 'font-mono text-[10px] tracking-wider text-muted-foreground';

const ROOT = {
  full: 'items-center gap-3 border-t border-border pt-6',
  compact: 'flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1',
} as const;

/** Project and author links, the NOTICE pointer, and the Simiancraft credit. */
export function SiteFooter({ density = 'full' }: SiteFooterProps) {
  return (
    <View role="contentinfo" className={ROOT[density]}>
      <View accessibilityLabel="Project and author links" className="flex-row items-center gap-5">
        <FooterLink href={REPO} label="react-native-roster on GitHub" glyph="github" />
        <FooterLink href="https://x.com/5imian" label="Jesse Harlin on X" glyph="x" />
        <FooterLink href="https://ko-fi.com/the_simian0604" label="Tip on Ko-fi" glyph="kofi" />
      </View>
      {density === 'full' ? (
        <Text className="max-w-xl text-center font-mono text-[10px] leading-relaxed tracking-wider text-muted-foreground">
          Every person and organization in the demo is generated. Full attributions:{' '}
          <Text
            className="underline"
            onPress={() => Linking.openURL(`${REPO}/blob/main/NOTICE.md`)}
          >
            NOTICE.md
          </Text>
          .
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Crafted with care by Simiancraft"
        onPress={() => Linking.openURL('https://simiancraft.com')}
        className="flex-row items-center gap-1.5"
      >
        <Text className={CREDIT}>Crafted with care by</Text>
        <Text className="text-muted-foreground">
          <Glyph name="simiancraft" size={14} />
        </Text>
        <Text className={`${CREDIT} underline`}>Simiancraft</Text>
      </Pressable>
    </View>
  );
}
