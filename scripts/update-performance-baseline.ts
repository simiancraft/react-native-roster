import { execFileSync } from 'node:child_process';
import { cpus, platform, release } from 'node:os';
import { parseArgs } from 'node:util';
import { measureWorkload } from '../test/performance/measure-workload';

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    machine: { type: 'string', default: `${platform()} ${release()}; ${cpus()[0]?.model}` },
    layout: { type: 'string' },
    coverage: { type: 'string' },
  },
});
console.warn('Warning: the committed baseline must come from a CI run; see docs/performance.md.');
if ((values.layout === undefined) !== (values.coverage === undefined)) {
  throw new Error('Supply both --layout and --coverage, or neither to measure locally.');
}
const timings =
  values.layout === undefined
    ? measureWorkload()
    : { layoutMs: Number(values.layout), coverageMs: Number(values.coverage) };
if (Object.values(timings).some((value) => !Number.isFinite(value) || value <= 0)) {
  throw new Error('--layout and --coverage must be positive finite milliseconds.');
}

const baseline = {
  ...timings,
  measuredAt: new Date().toISOString(),
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  workingTreeDirty:
    execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0,
  runtime: `Bun ${Bun.version}`,
  machine: values.machine,
  method: 'Median of 11 target-cold samples after five JIT warmups; W seed 1318',
};
await Bun.write(
  new URL('../test/performance/baseline.json', import.meta.url),
  `${JSON.stringify(baseline, null, 2)}\n`,
);
console.log(JSON.stringify(baseline, null, 2));
