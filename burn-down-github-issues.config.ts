/**
 * Repository config for the burn-down-github-issues skill
 * (https://github.com/simiancraft/simiancraft-skills). The loop ships with the skill; this file is
 * everything true of this repository. Run from the repo root:
 *
 *   bun run <skill-dir>/loop.ts --dry-run
 */
export default {
  /**
   * The CI jobs a landing must show green, by name, read off pull request #71. The main-protection
   * ruleset's required checks are unioned in; a landing with no written list is refused.
   */
  requiredChecks: [
    'Lint, Typecheck, Test',
    'Build demo bundle',
    'Analyze (actions)',
    'Analyze (javascript-typescript)',
  ],

  /**
   * Installed apps that open a check suite on every push and run nothing in it here; seen queued
   * with zero runs on main at 30b938c (2026-09-20). Codecov reports through commit statuses, so
   * its suite stays empty as well.
   */
  idleCheckSuiteApps: ['expo', 'simiancraft-banana-bot', 'codecov', 'claude'],

  /** Two lanes; each runs the full check, which exports the demo twice and drives Chromium. */
  concurrency: 2,

  project: {
    name: 'react-native-roster',
    repo: 'simiancraft/react-native-roster',
    remote: 'origin',
    baseBranch: 'main',
    evidenceBranch: '__evidence_locker__',
    checkCommand: 'bun run check',
    installCommand: 'bun install --frozen-lockfile',
    conventionDocs: ['AGENTS.md', 'CONTRIBUTING.md', 'docs/performance.md'],
    sizingScale:
      'no repository page; use story points where 1 is a single-file fix with its test and 2 is a contained change within one area README',
    sharedServices: ['the npm registry', 'the GitHub Pages deployment'],
    portBase: 42000,
    portSpan: 1000,
    /** Source uses relative imports; tests and the demo import the four package entry points. */
    pathAliases: [
      { prefix: 'react-native-roster/rrule', dir: 'src/adapters/rrule' },
      { prefix: 'react-native-roster/nativewind', dir: 'src/nativewind' },
      { prefix: 'react-native-roster/core', dir: 'src/core' },
      { prefix: 'react-native-roster', dir: 'src' },
    ],
    sourceExtensions: ['.ts', '.tsx', '.js', '.jsx'],
    alwaysInvalidates: [
      'package.json',
      'demo/package.json',
      'bun.lock',
      'tsconfig',
      'biome.json',
      'eslint.config',
      'knip.json',
      'lefthook.yml',
      '.releaserc.json',
      '.size-limit',
      'demo/app.config.js',
      'demo/metro.config.js',
      'demo/babel.config.js',
      'demo/tailwind.config.js',
      'demo/global.css',
      'test/support/',
      'test/performance/baseline.json',
      'scripts/',
      '.github/workflows/',
    ],
    /** semantic-release rewrites the changelog on every releasing merge; the version bump is recognized automatically. */
    releaseArtifacts: ['CHANGELOG.md'],
    touchPaths: {
      migration: [],
      ci: ['.github/workflows/', '.releaserc.json'],
    },
    worktreeRoot: '../.react-native-roster-loop',
  },
};
