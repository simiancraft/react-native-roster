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

const rosterCards = Object.entries(rosterFixtures).map(([id, fixture]) => ({
  id,
  title: fixture.title,
  description: fixture.description,
}));
const scheduleCards = Object.entries(scheduleFixtures).map(([id, fixture]) => ({
  id,
  title: fixture.title,
}));

export function GalleryHomeScreen() {
  return (
    <GalleryHomeLayout
      heroZone={<GalleryHero version={VERSION} />}
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
      footerZone={<Text className="font-mono text-xs text-zinc-600">{BUILD_LINE}</Text>}
    />
  );
}
