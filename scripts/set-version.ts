import { setVersion } from './lib/package-version';

await setVersion(process.argv[2], new URL('../package.json', import.meta.url));
