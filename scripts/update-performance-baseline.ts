import { execFileSync } from 'node:child_process';
import { cpus, platform, release } from 'node:os';
import { measureWorkload } from '../test/fixtures/performance';

const baseline = {
  ...measureWorkload(),
  measuredAt: new Date().toISOString(),
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  workingTreeDirty:
    execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0,
  runtime: `Bun ${Bun.version}`,
  machine: `${platform()} ${release()}; ${cpus()[0]?.model}`,
  method: 'Median of 11 target-cold samples after five JIT warmups; W seed 1318',
};
await Bun.write(
  new URL('../test/performance-baseline.json', import.meta.url),
  `${JSON.stringify(baseline, null, 2)}\n`,
);
console.log(JSON.stringify(baseline, null, 2));
