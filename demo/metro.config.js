const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const config = getDefaultConfig(projectRoot);

// Watch source in the parent package and resolve through its exports map.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = false;
config.resolver.unstable_enablePackageExports = true;

const nwConfig = withNativeWind(config, { input: './global.css' });

// Pin React, React DOM, and React Native to the demo's single copy. Keep the
// NativeWind resolver's origin intact for its own JSX interop modules.
const FORCE_SINGLE = ['react', 'react-dom', 'react-native'];
const upstreamResolveRequest = nwConfig.resolver.resolveRequest;
nwConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = upstreamResolveRequest ?? context.resolveRequest;
  const forced = FORCE_SINGLE.some((p) => moduleName === p || moduleName.startsWith(`${p}/`));
  const ctx = forced
    ? { ...context, originModulePath: path.join(projectRoot, 'index.js') }
    : context;
  return resolve(ctx, moduleName, platform);
};

module.exports = nwConfig;
