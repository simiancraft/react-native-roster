import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { ScrollView, Text } from 'react-native';
import { rosterFixtures } from '../../test/fixtures/roster';
import { scheduleFixtures } from '../../test/fixtures/schedule';

const VERSION = Constants.expoConfig?.version ?? '?';
const BUILD = (Constants.expoConfig?.extra?.build ?? {}) as { gitSha?: string; builtAt?: string };
const GIT_SHA = (BUILD.gitSha ?? 'local').slice(0, 7);
const BUILT_AT = BUILD.builtAt ? `${BUILD.builtAt.replace('T', ' ').slice(0, 16)}Z` : 'dev';
const BUILD_LINE = `v${VERSION} · ${GIT_SHA} · ${BUILT_AT}`;

// A static route shell; fixture features follow Zone Composer as they arrive.
export default function HomeScreen() {
  return (
    <ScrollView
      className="flex-1 bg-zinc-950"
      contentContainerStyle={{ alignItems: 'center', gap: 16, padding: 24 }}
    >
      <Text accessibilityRole="header" className="text-4xl font-semibold text-white">
        roster
      </Text>
      {Object.entries(rosterFixtures).map(([id, fixture]) => (
        <Link key={id} href={`/gallery/${id}` as '/gallery/empty'} style={{ color: '#a5b4fc' }}>
          {fixture.title}
        </Link>
      ))}
      {Object.entries(scheduleFixtures).map(([id, fixture]) => (
        <Link key={id} href={`/gallery/${id}` as '/gallery/empty'} style={{ color: '#a5b4fc' }}>
          {fixture.title}
        </Link>
      ))}
      <Text className="font-mono text-xs text-zinc-400">{BUILD_LINE}</Text>
    </ScrollView>
  );
}
