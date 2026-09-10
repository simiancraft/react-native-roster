import Constants from 'expo-constants';
import { Text } from 'react-native';
import { rosterFixtures } from '../../../../test/fixtures/roster';
import { scheduleFixtures } from '../../../../test/fixtures/schedule';
import type { LinkZone } from './home.types';
import { GalleryHomeLayout } from './layout';
import { FixtureSection } from './parts/fixture-section';
import { GalleryHero } from './parts/hero';

const VERSION = Constants.expoConfig?.version ?? '?';
const BUILD = (Constants.expoConfig?.extra?.build ?? {}) as { gitSha?: string; builtAt?: string };
const GIT_SHA = (BUILD.gitSha ?? 'local').slice(0, 7);
const BUILT_AT = BUILD.builtAt ? `${BUILD.builtAt.replace('T', ' ').slice(0, 16)}Z` : 'dev';
const BUILD_LINE = `v${VERSION} · ${GIT_SHA} · ${BUILT_AT}`;

type GalleryHomeScreenProps = {
  /** Where the showcase lives; the route shell owns the URL space. */
  showcaseHref: string;
  /** Resolves a fixture id to its route. */
  fixtureHref: (id: string) => string;
  /** The host's link element around each card. */
  linkZone: LinkZone;
};

export function GalleryHomeScreen({ showcaseHref, fixtureHref, linkZone }: GalleryHomeScreenProps) {
  const rosterCards = Object.entries(rosterFixtures).map(([id, fixture]) => ({
    id,
    href: fixtureHref(id),
    title: fixture.title,
    description: fixture.description,
  }));
  const scheduleCards = Object.entries(scheduleFixtures).map(([id, fixture]) => ({
    id,
    href: fixtureHref(id),
    title: fixture.title,
  }));
  return (
    <GalleryHomeLayout
      heroZone={<GalleryHero version={VERSION} showcaseHref={showcaseHref} linkZone={linkZone} />}
      sectionsZone={
        <>
          <FixtureSection
            title="Roster fixtures"
            blurb="Many lanes on one horizontal axis: zones, axis steps, provenance, sorting, timezones, and the 200-lane workload."
            fixtures={rosterCards}
            linkZone={linkZone}
          />
          <FixtureSection
            title="Schedule fixtures"
            blurb="One lane projected into day columns: layers, exclusions, clock changes, skipped dates, and every zone."
            fixtures={scheduleCards}
            linkZone={linkZone}
          />
        </>
      }
      footerZone={<Text className="font-mono text-xs text-muted-foreground">{BUILD_LINE}</Text>}
    />
  );
}
