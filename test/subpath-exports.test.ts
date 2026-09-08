import { describe, expect, it } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pkg from '../package.json';

const root = fileURLToPath(new URL('../', import.meta.url));

// Build first. Missing output must fail this gate, including on a fresh checkout.
describe('subpath exports', () => {
  it('ships both sides of each browser platform remap', () => {
    for (const [native, web] of Object.entries(pkg.browser)) {
      expect(existsSync(new URL(`../${native}`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../${web}`, import.meta.url))).toBe(true);
    }
  });
  for (const [subpath, conditions] of Object.entries(pkg.exports)) {
    it(`${subpath} resolves every declared condition to a shipped file`, () => {
      const targets = typeof conditions === 'string' ? [conditions] : Object.values(conditions);
      for (const target of targets) {
        expect(existsSync(new URL(`../${target}`, import.meta.url))).toBe(true);
      }
      if (typeof conditions !== 'string') {
        expect(conditions.types.startsWith('./dist/')).toBe(true);
        expect(conditions.default.startsWith('./dist/')).toBe(true);
        expect(conditions['react-native'].startsWith('./src/')).toBe(true);
      }
    });
  }

  it('Node require and ESM import resolve every package specifier through exports', () => {
    const script = `
      import assert from 'node:assert/strict';
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
      // Supply native host peers; Node cannot parse React Native's Flow source.
      const Module = require('node:module');
      const originalLoad = Module._load;
      Module._load = function(specifier, ...args) {
        if (specifier === 'react-native') return { View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView' };
        if (specifier === 'react-native-reanimated') return { __esModule: true, default: { View: 'AnimatedView' } };
        if (specifier === '@legendapp/list') return { LegendList: 'LegendList' };
        return originalLoad.call(this, specifier, ...args);
      };
      const pkg = require('react-native-roster/package.json');
      for (const subpath of Object.keys(pkg.exports)) {
        const specifier = pkg.name + subpath.slice(1);
        const target = pkg.exports[subpath];
        const defaultPath = typeof target === 'string' ? target : target.default;
        assert.equal(require.resolve(specifier), new URL(defaultPath, import.meta.url).pathname);
        assert.equal(typeof require(specifier), 'object');
        const imported = subpath === './package.json'
          ? await import(specifier, { with: { type: 'json' } })
          : await import(specifier);
        assert.equal(typeof imported, 'object');
      }
      const core = require('react-native-roster/core');
      const root = require('react-native-roster');
      assert.equal(root.layoutLane, core.layoutLane);
      assert.equal(typeof root.Roster, 'function');
      assert.equal(typeof root.useRoster, 'function');
      for (const name of [
        'layoutLane', 'coverageFor', 'flagFor', 'snapToStep', 'timeAtX', 'timeAtY',
        'windowFor', 'prev', 'next', 'today', 'dayColumnsFor', 'layoutStats',
        'coverageStats', 'resetStats', 'clearLayoutCache', 'clearCoverageCache',
      ]) assert.equal(typeof core[name], 'function');
      const window = core.windowFor({ span: 'day', anchorDate: '2024-01-01', timezone: 'UTC' });
      const geometry = core.layoutLane({ id: 'one', label: 'One', layers: [] }, window, {
        orientation: 'horizontal', viewTimezone: 'UTC', pxPerMinute: 1, rowHeight: 40,
      });
      assert.deepEqual(geometry.rects, []);
      assert.equal(geometry.flag, 'none');
      process.stdout.write('ok');
    `;
    expect(
      execFileSync('node', ['--input-type=module', '-e', script], { cwd: root, encoding: 'utf8' }),
    ).toBe('ok');
  });
});
