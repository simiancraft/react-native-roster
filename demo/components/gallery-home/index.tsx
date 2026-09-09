import Constants from 'expo-constants';
import { Text } from 'react-native';
import { rosterFixtures } from '../../../test/fixtures/roster';
import { scheduleFixtures } from '../../../test/fixtures/schedule';
import { GalleryHomeLayout } from './layout';
import { FixtureSection } from './parts/fixture-section';
import { GalleryHero } from './parts/hero';

const VERSION = Constants.expoConfig?.version ?? '?';
const BUILD = (Constants.expoConfig?.extra?.build ?? {}) as { gitSha?: string; builtAt?: string };
const GIT_SHA = (BUILD.gitSha ?? 'local').slice(0, 7);
const BUILT_AT = BUILD.builtAt ? `${BUILD.builtAt.replace('T', ' ').slice(0, 16)}Z` : 'dev';
const BUILD_LINE = `v${VERSION} · ${GIT_SHA} · ${BUILT_AT}`;

// Route shapes are decided here, in the shell-facing chassis, not in the cards.
const rosterCards = Object.entries(rosterFixtures).map(([id, fixture]) => ({
  id,
  href: `/gallery/${id}`,
  title: fixture.title,
  description: fixture.description,
}));
const scheduleCards = Object.entries(scheduleFixtures).map(([id, fixture]) => ({
  id,
  href: `/gallery/${id}`,
  title: fixture.title,
}));

export function GalleryHomeScreen() {
  return (
    <GalleryHomeLayout
      heroZone={<GalleryHero version={VERSION} showcaseHref="/showcase" />}
      sectionsZone={
        <>
          <FixtureSection
            title="Roster fixtures"
            blurb="Many lanes on one horizontal axis: zones, axis steps, provenance, sorting, timezones, and the 200-lane workload."
            fixtures={rosterCards}
          />
          <FixtureSection
            title="Schedule fixtures"
            blurb="One lane projected into day columns: layers, exclusions, clock changes, skipped dates, and every zone."
            fixtures={scheduleCards}
          />
        </>
      }
      footerZone={<Text className="font-mono text-xs text-muted-foreground">{BUILD_LINE}</Text>}
    />
  );
}
