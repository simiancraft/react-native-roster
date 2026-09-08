// Plain CommonJS so Node-based config readers and the local CLI agree.
const gitSha =
  process.env.EAS_BUILD_GIT_COMMIT_HASH ||
  (() => {
    try {
      return require('node:child_process')
        .execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      return 'local';
    }
  })();
const builtAt = new Date().toISOString();

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'roster',
  slug: 'react-native-roster-demo',
  version: '0.0.0',
  orientation: 'portrait',
  scheme: 'roster-demo',
  userInterfaceStyle: 'automatic',
  platforms: ['ios', 'android', 'web'],
  ios: { supportsTablet: true, bundleIdentifier: 'com.simiancraft.roster.demo' },
  android: { package: 'com.simiancraft.roster.demo' },
  web: { bundler: 'metro', output: 'static' },
  experiments: {
    reactCompiler: true,
    ...(process.env.GITHUB_PAGES ? { baseUrl: '/react-native-roster' } : {}),
  },
  plugins: ['expo-router'],
  extra: { build: { gitSha, builtAt } },
};

module.exports = config;
