import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { rosterFixtures } from '../../test/fixtures/roster';

const VERSION = Constants.expoConfig?.version ?? '?';
const BUILD = (Constants.expoConfig?.extra?.build ?? {}) as { gitSha?: string; builtAt?: string };
const GIT_SHA = (BUILD.gitSha ?? 'local').slice(0, 7);
const BUILT_AT = BUILD.builtAt ? `${BUILD.builtAt.replace('T', ' ').slice(0, 16)}Z` : 'dev';
const BUILD_LINE = `v${VERSION} · ${GIT_SHA} · ${BUILT_AT}`;

// A static route shell; fixture features follow Zone Composer as they arrive.
export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-zinc-950 p-6">
      <Text accessibilityRole="header" className="text-4xl font-semibold text-white">
        roster
      </Text>
      {Object.entries(rosterFixtures).map(([id, fixture]) => (
        <Link key={id} href={`/gallery/${id}` as '/gallery/empty'} style={{ color: '#a5b4fc' }}>
          {fixture.title}
        </Link>
      ))}
      <Text className="font-mono text-xs text-zinc-400">{BUILD_LINE}</Text>
    </View>
  );
}
