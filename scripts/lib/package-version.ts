import { valid } from 'semver';

/** Rewrite only the release version; preserve the rest of the package manifest. */
export async function setVersion(version: string | undefined, manifest: string | URL) {
  if (!version || valid(version) !== version.split('+')[0]) {
    throw new Error('Expected a canonical semantic version.');
  }
  const file = Bun.file(manifest);
  const pkg = await file.json();
  pkg.version = version;
  await Bun.write(file, `${JSON.stringify(pkg, null, 2)}\n`);
}
