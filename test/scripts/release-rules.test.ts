import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// @ts-expect-error The installed analyzer does not ship TypeScript declarations.
import { analyzeCommits } from '@semantic-release/commit-analyzer';
// @ts-expect-error The installed generator does not ship TypeScript declarations.
import { generateNotes } from '@semantic-release/release-notes-generator';

const cwd = fileURLToPath(new URL('../../', import.meta.url));
const config = JSON.parse(readFileSync(new URL('../../.releaserc.json', import.meta.url), 'utf8'));
function pluginOptions(name: string) {
  const plugin = config.plugins.find((entry: unknown) => Array.isArray(entry) && entry[0] === name);
  if (!plugin) throw new Error(`Missing ${name} configuration`);
  return plugin[1];
}
const analyzer = pluginOptions('@semantic-release/commit-analyzer');
const generator = pluginOptions('@semantic-release/release-notes-generator');
const hash = '0123456789abcdef0123456789abcdef01234567';
function context(message: string) {
  return { cwd, commits: [{ hash, message }], logger: { log() {} } };
}

const rows: [string, string | null][] = [
  ['feat', 'minor'],
  ['fix', 'patch'],
  ['perf', 'patch'],
  ['refactor', 'patch'],
  ['revert', 'patch'],
  ['build', 'patch'],
  ['docs', 'patch'],
  ['chore', null],
  ['style', null],
  ['test', null],
  ['ci', null],
];
const cases: [string, string | null][] = rows.flatMap(([type, release]) =>
  ['', '(core)', '(render)', '(release)', '(demo)'].flatMap((scope): [string, string | null][] => [
    [`${type}${scope}: x`, scope === '(demo)' ? null : release],
    [`${type}${scope}!: x`, scope === '(demo)' ? null : 'major'],
    [
      `${type}${scope}: x\n\nBREAKING CHANGE: remove the old contract`,
      scope === '(demo)' ? null : 'major',
    ],
  ]),
);
for (const scope of ['deps', 'deps-dev']) {
  cases.push(
    [`chore(${scope}): x`, 'patch'],
    [`chore(${scope})!: x`, 'major'],
    [`chore(${scope}): x\n\nBREAKING CHANGE: remove the old contract`, 'major'],
  );
}

const demoDefaults: [string, string][] = [
  ['feat(demo): x', 'minor'],
  ['fix(demo): x', 'patch'],
  ['perf(demo): x', 'patch'],
  ['feat(demo)!: x', 'major'],
  ['fix(demo): x\n\nBREAKING CHANGE: remove the old contract', 'major'],
];

describe('release rules', () => {
  it.each(cases)('%s -> %s', async (message, expected) => {
    expect(await analyzeCommits(analyzer, context(message))).toBe(expected);
  });

  it.each(demoDefaults)('suppresses preset fallback for %s', async (message, fallback) => {
    const withoutDemoRule = {
      ...analyzer,
      releaseRules: analyzer.releaseRules.filter(
        (rule: { scope?: string }) => rule.scope !== 'demo',
      ),
    };
    expect(await analyzeCommits(withoutDemoRule, context(message))).toBe(fallback);
    expect(await analyzeCommits(analyzer, context(message))).toBeNull();
  });

  it('uses the same preset to render breaking release notes', async () => {
    expect(analyzer.preset).toBe('conventionalcommits');
    expect(generator.preset).toBe(analyzer.preset);
    const notes = await generateNotes(generator, {
      ...context(
        'feat(core)!: replace the interval contract\n\nBREAKING CHANGE: remove the old contract',
      ),
      options: { repositoryUrl: 'https://github.com/simiancraft/react-native-roster.git' },
      lastRelease: { version: '1.0.0', gitTag: 'v1.0.0' },
      nextRelease: { version: '2.0.0', gitTag: 'v2.0.0' },
    });
    expect(notes).toContain('2.0.0');
    expect(notes).toContain('BREAKING CHANGES');
    expect(notes).toContain('remove the old contract');
    expect(notes).toContain('replace the interval contract');
    expect(notes).toContain(`/commit/${hash}`);
  });
});
