import { describe, expect, it } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import pkg from '../../package.json';

const root = resolve(import.meta.dir, '../..');
const demoRoot = join(root, 'demo');
const originModulePath = join(demoRoot, 'app/index.tsx');

type MetroHarnessResult = {
  demoResolved: Record<string, string>;
  forwarded: Record<string, Record<string, { conditions: string[]; originModulePath: string }>>;
  metroResolved: Record<string, Record<string, string>>;
};

function runMetroHarness(
  moduleNames: string[],
  platforms = ['web'],
  resolveWithNode = true,
): MetroHarnessResult {
  const script = `
    const fs = require('node:fs');
    const { createRequire } = require('node:module');
    const path = require('node:path');
    const { resolve: metroResolve } = require('metro-resolver');
    const demoRoot = ${JSON.stringify(demoRoot)};
    const root = path.dirname(demoRoot);
    const originModulePath = path.join(demoRoot, 'app/index.tsx');
    const demoRequire = createRequire(path.join(demoRoot, 'index.js'));
    process.chdir(demoRoot);
    const config = demoRequire('./metro.config.js');

    function readPackage(packageJsonPath) {
      if (!fs.existsSync(packageJsonPath)) return null;
      return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    }
    function packageForModule(absoluteModulePath) {
      let directory = fs.existsSync(absoluteModulePath) && fs.statSync(absoluteModulePath).isDirectory()
        ? absoluteModulePath
        : path.dirname(absoluteModulePath);
      while (true) {
        const packageJson = readPackage(path.join(directory, 'package.json'));
        if (packageJson) return {
          rootPath: directory,
          packageJson,
          packageRelativePath: path.relative(directory, absoluteModulePath),
        };
        if (path.basename(directory) === 'node_modules') return null;
        const parent = path.dirname(directory);
        if (parent === directory) return null;
        directory = parent;
      }
    }
    function context() {
      return {
        allowHaste: true,
        assetExts: new Set(config.resolver.assetExts),
        customResolverOptions: { __proto__: null },
        dev: true,
        disableHierarchicalLookup: config.resolver.disableHierarchicalLookup,
        doesFileExist: (filePath) => fs.existsSync(filePath) && fs.lstatSync(filePath).isFile(),
        extraNodeModules: config.resolver.extraNodeModules,
        fileSystemLookup: (filePath) => {
          if (!fs.existsSync(filePath)) return { exists: false };
          const stats = fs.statSync(filePath);
          return { exists: true, realPath: fs.realpathSync(filePath), type: stats.isDirectory() ? 'd' : 'f' };
        },
        getPackage: readPackage,
        getPackageForModule: packageForModule,
        isESMImport: false,
        mainFields: config.resolver.resolverMainFields,
        nodeModulesPaths: config.resolver.nodeModulesPaths,
        originModulePath,
        preferNativePlatform: true,
        redirectModulePath: (modulePath) => modulePath,
        resolveAsset: () => null,
        resolveHasteModule: () => null,
        resolveHastePackage: () => null,
        resolveRequest: config.resolver.resolveRequest,
        sourceExts: config.resolver.sourceExts,
        unstable_conditionNames: config.resolver.unstable_conditionNames,
        unstable_conditionsByPlatform: config.resolver.unstable_conditionsByPlatform,
        unstable_enablePackageExports: config.resolver.unstable_enablePackageExports,
        unstable_logWarning: () => {},
      };
    }
    function forwardedContext(moduleName, platform) {
      let forwarded;
      config.resolver.resolveRequest({
        dev: true,
        originModulePath,
        unstable_conditionNames: ['require', 'browser'],
        resolveRequest(innerContext) {
          forwarded = innerContext;
          return { type: 'sourceFile', filePath: path.join(root, 'resolver-probe.js') };
        },
      }, moduleName, platform);
      return {
        conditions: forwarded.unstable_conditionNames,
        originModulePath: forwarded.originModulePath,
      };
    }

    const moduleNames = ${JSON.stringify(moduleNames)};
    const platforms = ${JSON.stringify(platforms)};
    const metroResolved = Object.fromEntries(platforms.map((platform) => [
      platform,
      Object.fromEntries(moduleNames.map((moduleName) => {
        const resolution = metroResolve(context(), moduleName, platform);
        if (resolution.type !== 'sourceFile') throw new Error(moduleName + ' did not resolve to a file');
        return [moduleName, resolution.filePath];
      })),
    ]));
    const result = {
      demoResolved: ${JSON.stringify(resolveWithNode)}
        ? Object.fromEntries(moduleNames.map((name) => [name, demoRequire.resolve(name)]))
        : {},
      forwarded: Object.fromEntries(platforms.map((platform) => [
        platform,
        Object.fromEntries(moduleNames.map((name) => [name, forwardedContext(name, platform)])),
      ])),
      metroResolved,
    };
    process.stdout.write(JSON.stringify(result));
  `;
  return JSON.parse(
    execFileSync('node', ['--input-type=commonjs', '-e', script], { cwd: root, encoding: 'utf8' }),
  ) as MetroHarnessResult;
}

const compatibilityHarness = runMetroHarness([
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-native',
  'nativewind/jsx-runtime',
  '@legendapp/list',
]);

describe('effective demo Metro resolver', () => {
  for (const moduleName of ['react', 'react/jsx-runtime', 'react-dom', 'react-native']) {
    it(`resolves ${moduleName} from the demo dependency tree`, () => {
      expect(compatibilityHarness.metroResolved.web?.[moduleName]).toBe(
        compatibilityHarness.demoResolved[moduleName],
      );
      expect(compatibilityHarness.forwarded.web?.[moduleName]?.originModulePath).toBe(
        join(demoRoot, 'index.js'),
      );
    });
  }

  it('preserves the importer origin for NativeWind JSX interop', () => {
    expect(compatibilityHarness.forwarded.web?.['nativewind/jsx-runtime']?.originModulePath).toBe(
      originModulePath,
    );
    expect(compatibilityHarness.metroResolved.web?.['nativewind/jsx-runtime']).toBe(
      compatibilityHarness.demoResolved['nativewind/jsx-runtime'],
    );
  });

  it('preserves resolver conditions for unrelated packages', () => {
    expect(compatibilityHarness.forwarded.web?.['@legendapp/list']?.conditions).toEqual([
      'require',
      'browser',
    ]);
    expect(compatibilityHarness.forwarded.web?.['@legendapp/list']?.originModulePath).toBe(
      originModulePath,
    );
  });
});

describe('workspace package source resolution', () => {
  const expectedSources = {
    'react-native-roster': 'src/index.ts',
    'react-native-roster/core': 'src/core/index.ts',
    'react-native-roster/rrule': 'src/adapters/rrule/index.ts',
    'react-native-roster/nativewind': 'src/nativewind/index.ts',
  } as const;
  const sourceHarness = runMetroHarness(
    Object.keys(expectedSources),
    ['web', 'ios', 'android'],
    false,
  );

  for (const platform of ['web', 'ios', 'android']) {
    for (const [moduleName, sourcePath] of Object.entries(expectedSources)) {
      it(`resolves ${moduleName} to source on ${platform} without rebuilding dist`, () => {
        expect(sourceHarness.metroResolved[platform]?.[moduleName]).toBe(join(root, sourcePath));
        expect(sourceHarness.forwarded[platform]?.[moduleName]?.conditions).toEqual([
          'react-native',
          'require',
          'browser',
        ]);
        expect(sourceHarness.forwarded[platform]?.[moduleName]?.originModulePath).toBe(
          originModulePath,
        );
      });
    }
  }
});

describe('Node package resolution', () => {
  const expectedDefaults = {
    '.': './dist/src/index.js',
    './core': './dist/src/core/index.js',
    './rrule': './dist/src/adapters/rrule/index.js',
    './nativewind': './dist/src/nativewind/index.js',
  } as const;

  it('selects emitted CommonJS defaults for every public library entry point', () => {
    const fixtureParent = join(root, '.cache');
    mkdirSync(fixtureParent, { recursive: true });
    const fixtureRoot = mkdtempSync(join(fixtureParent, 'metro-resolution-'));
    const packageRoot = join(fixtureRoot, 'node_modules', pkg.name);

    try {
      writeFileSync(join(fixtureRoot, 'package.json'), '{"name":"resolver-consumer"}\n');
      for (const subpath of Object.keys(expectedDefaults) as Array<keyof typeof expectedDefaults>) {
        const defaultPath = expectedDefaults[subpath];
        expect(pkg.exports[subpath].default).toBe(defaultPath);
        const target = join(packageRoot, defaultPath);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, 'module.exports = {};\n');
      }
      writeFileSync(
        join(packageRoot, 'package.json'),
        `${JSON.stringify({ name: pkg.name, type: pkg.type, exports: pkg.exports })}\n`,
      );

      const script = `
        const path = require('node:path');
        const entries = ${JSON.stringify(expectedDefaults)};
        const resolved = Object.fromEntries(Object.entries(entries).map(([subpath]) => {
          const specifier = '${pkg.name}' + subpath.slice(1);
          return [subpath, path.relative(process.cwd(), require.resolve(specifier))];
        }));
        process.stdout.write(JSON.stringify(resolved));
      `;
      const output = execFileSync('node', ['--input-type=commonjs', '-e', script], {
        cwd: fixtureRoot,
        encoding: 'utf8',
      });
      const resolved = JSON.parse(output) as Record<string, string>;
      for (const subpath of Object.keys(expectedDefaults) as Array<keyof typeof expectedDefaults>) {
        const defaultPath = expectedDefaults[subpath];
        expect(resolved[subpath]).toBe(join('node_modules', pkg.name, defaultPath));
      }
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });
});
