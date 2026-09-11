import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { setVersion } from '../../scripts/lib/package-version';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  for (const path of temporaryDirectories.splice(0))
    await rm(path, { recursive: true, force: true });
});

async function manifest() {
  const dir = await mkdtemp(join(import.meta.dir, '.release-'));
  temporaryDirectories.push(dir);
  const path = join(dir, 'package.json');
  await Bun.write(
    path,
    `${JSON.stringify({ name: 'fixture', version: '0.0.0', files: ['src'] })}\n`,
  );
  return path;
}

describe('set-version', () => {
  it.each(['1.2.3', '2.0.0-rc.1', '1.0.0+build.42'])(
    'writes %s and preserves other fields',
    async (version) => {
      const path = await manifest();
      await setVersion(version, path);
      expect(await Bun.file(path).json()).toEqual({ name: 'fixture', version, files: ['src'] });
      expect((await Bun.file(path).text()).endsWith('\n')).toBe(true);
    },
  );

  it.each([undefined, '', 'next', 'v1.2.3', '1.2', '01.2.3', '1.0.0-01'])(
    'rejects %s without changing the manifest',
    async (version) => {
      const path = await manifest();
      const before = await Bun.file(path).text();
      await expect(setVersion(version, path)).rejects.toThrow('canonical semantic version');
      expect(await Bun.file(path).text()).toBe(before);
    },
  );

  it('runs the release command against a fixture package', async () => {
    const path = await manifest();
    const script = join(path, '..', 'scripts', 'set-version.ts');
    await Bun.write(
      script,
      await Bun.file(new URL('../../scripts/set-version.ts', import.meta.url)).text(),
    );
    await Bun.write(
      join(script, '..', 'lib', 'package-version.ts'),
      await Bun.file(new URL('../../scripts/lib/package-version.ts', import.meta.url)).text(),
    );
    const result = Bun.spawnSync([process.execPath, script, '3.2.1']);
    expect(result.exitCode).toBe(0);
    expect((await Bun.file(path).json()).version).toBe('3.2.1');
  });
});
