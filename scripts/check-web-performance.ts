import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, type Page } from 'playwright';
import type { CounterBridgeInput } from '../demo/components/gallery/fixtures/counter-bridge.types';
import { envelopeFor } from '../src/adapters/rrule';
import { next, windowFor } from '../src/core';
import { performanceRuleSet } from '../test/fixtures/performance-lanes';

const rosterWindowSpec = { span: 'week' as const, anchorDate: '2024-01-01', timezone: 'UTC' };

declare global {
  interface Window {
    __roster?: CounterBridgeInput;
  }
}

const set = performanceRuleSet();
const occurrenceCalls = set.rules.length + set.dates.length;
const firstWindow = windowFor(rosterWindowSpec);
const nextWindow = windowFor(next(rosterWindowSpec));
const retained = [envelopeFor(firstWindow)];

let root = resolve('demo/dist');
assert(
  await Bun.file(`${root}/gallery/200-lanes.html`).exists(),
  'Export demo web before check:web',
);
await mkdir('.cache/web-performance', { recursive: true });
const server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  async fetch(request) {
    const pathname = decodeURIComponent(new URL(request.url).pathname);
    const path = resolve(root, `.${pathname}`);
    if (!path.startsWith(`${root}/`)) return new Response('Not found', { status: 404 });
    for (const candidate of [path, `${path}.html`, `${path}/index.html`]) {
      const file = Bun.file(candidate);
      if (await file.exists()) return new Response(file);
    }
    return new Response('Not found', { status: 404 });
  },
});
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } });
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.context().tracing.start({ screenshots: true, snapshots: true });
try {
  await page.goto(`${server.url}gallery/200-lanes`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__roster?.expandStats);
  await page.getByTestId('roster-vertical-scroll').waitFor();
  // Fix W's physical viewport at 24 rows without altering the roster implementation.
  const height = await page
    .getByTestId('roster-vertical-scroll')
    .evaluate((node) => node.clientHeight);
  await page.setViewportSize({ width: 1440, height: 1600 + 24 * 48 - height });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__roster?.expandStats);
  await settle(page);
  assert.equal(
    await page.getByTestId('roster-vertical-scroll').evaluate((node) => node.clientHeight),
    24 * 48,
  );
  await page.getByRole('button', { name: '15 min', exact: true }).click();
  await page.evaluate(() => {
    const bridge = window.__roster as CounterBridgeInput;
    bridge.clearLayoutCache();
    bridge.clearCoverageCache();
    bridge.clearExpandCache?.();
    bridge.resetStats();
    bridge.resetExpandStats?.();
  });
  // Trigger a real render after clearing, then warm precisely the range we will revisit.
  await click('Change last lane zone');
  assert.equal((await counters()).expand.expanded, occurrenceCalls);
  await click('Change last lane zone');
  const mounted = await page.locator('[data-testid^="roster-lane-lane-"]').count();
  assert(mounted >= 24 && mounted <= 26, `Unexpected mounted range: ${mounted}`);
  await row('view-zone change', () => click('America/Chicago'), {
    expanded: 0,
    layout: mounted,
    coverage: 200,
  });
  // Edit while back at the original absolute window so unchanged rules retain exact envelope keys.
  await click('UTC');
  await scrollRange();
  await row('scroll (second pass)', scrollRange, { expanded: 0, layout: 0 });
  await row(
    'lane selection',
    async () => {
      await page
        .locator('[data-testid^="roster-lane-lane-"]')
        .first()
        .click({ position: { x: 20, y: 20 } });
      await settle(page);
    },
    { expanded: 0, layout: 0 },
  );
  await row('highlight', () => click('Highlight rule (fresh source)'), { expanded: 0, layout: 0 });
  // Visit the target sort once, then return before measuring its target-warm revisit.
  await click('Sort: availability');
  await click('Sort: label');
  await row('sort', () => click('Sort: availability'), { expanded: 0, layout: 0 });
  await row('unrelated lane-zone change', () => click('Change last lane zone'), {
    expanded: 0,
    layout: 0,
  });
  await row('rule body change', () => click('Change rule hours'), { expanded: 1 });
  assert(
    retained.every(
      (envelope) => nextWindow.start < envelope.start || nextWindow.end > envelope.end,
    ),
    'Next must be outside every retained envelope',
  );
  await row('next week outside all retained envelopes', () => click('Next'), {
    expanded: occurrenceCalls,
  });
  retained.push(envelopeFor(nextWindow));
  assert(
    retained.some(
      (envelope) => firstWindow.start >= envelope.start && firstWindow.end <= envelope.end,
    ),
    'Previous must be inside a retained envelope',
  );
  await row('previous week inside retained envelope', () => click('Previous'), { expanded: 0 });
  await click('Measure cold layout');
  assert.match(
    await page.getByTestId('roster-selection').innerText(),
    /Target-cold layout: [0-9.]+ ms; 24 runs, 0 hits/,
  );
  assert.deepEqual(errors, [], 'Browser runtime errors');
  await page.screenshot({ path: '.cache/web-performance/200-lanes.png' });
  console.log(
    `Web performance: all action budgets pass; 24-row viewport, ${mounted} mounted lanes.`,
  );
  await page.goto(`${server.url}gallery/interval-detail`, { waitUntil: 'networkidle' });
  const detailLane = page.getByTestId('roster-lane-one');
  await detailLane.waitFor();
  const laneWidth = await detailLane.evaluate((node) => node.clientWidth);
  await detailLane.click({ position: { x: (laneWidth * 10) / 24, y: 20 } });
  await page.getByTestId('interval-detail').waitFor();
  assert.match(await page.getByTestId('interval-detail').innerText(), /Lane one/);
  const firstDetail = await page.getByTestId('interval-detail').innerText();
  // Locator clicks dispatch pointerdown, pointerup, and click through the body.
  await detailLane.click({ position: { x: (laneWidth * 19) / 24, y: 20 } });
  await page.waitForFunction(
    (previous) =>
      document.querySelector('[data-testid="interval-detail"]')?.textContent !== previous,
    firstDetail,
  );
  assert.notEqual(await page.getByTestId('interval-detail').innerText(), firstDetail);
  await detailLane.click({ position: { x: 10, y: 20 } });
  await page.getByTestId('interval-detail').waitFor({ state: 'hidden' });
  await detailLane.click({ position: { x: (laneWidth * 10) / 24, y: 20 } });
  await page.getByTestId('interval-detail').waitFor();
  await detailLane.click({ position: { x: (laneWidth * 10) / 24, y: 20 } });
  await page.getByTestId('interval-detail').waitFor({ state: 'hidden' });
  await detailLane.click({ position: { x: (laneWidth * 10) / 24, y: 20 } });
  await page.getByTestId('interval-detail').waitFor();
  await page.getByRole('heading', { name: 'Interval details', exact: true }).click();
  await page.getByTestId('interval-detail').waitFor({ state: 'hidden' });
  await detailLane.click({ position: { x: (laneWidth * 10) / 24, y: 20 } });
  await page.getByTestId('interval-detail').waitFor();
  await page.keyboard.press('Escape');
  await page.getByTestId('interval-detail').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'Show inspector', exact: true }).click();
  await detailLane.click({ position: { x: (laneWidth * 10) / 24, y: 20 } });
  await page.getByTestId('interval-detail').waitFor();
  await page.getByRole('button', { name: 'Close details', exact: true }).click();
  await page.getByTestId('interval-detail').waitFor({ state: 'hidden' });
  assert.deepEqual(errors, [], 'Selection browser runtime errors');
  console.log(
    'Selection: popover toggles, cell press, outside press, and Escape dismiss, and inspector opens and dismisses.',
  );
  root = resolve('demo/.cache/dev-dist');
  assert(
    await Bun.file(`${root}/gallery/200-lanes.html`).exists(),
    'Export development web before check:web',
  );
  await page.goto(`${server.url}gallery/200-lanes`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__roster?.profileStats);
  await settle(page);
  const profile = await profileStats();
  assert(profile.body.mounts > 0, 'Development body Profiler must record a mount');
  assert(
    Object.values(profile.lanes).filter((lane) => lane.mounts > 0).length >= 24,
    'Development LaneRow Profilers must record mounted rows',
  );
  await scrollRange();
  const before = await profileStats();
  const continuous = new Set(await mountedIds());
  await scrollRange(async () => {
    const mounted = new Set(await mountedIds());
    for (const id of continuous) if (!mounted.has(id)) continuous.delete(id);
  });
  const after = await profileStats();
  assert(continuous.size >= 8, `Expected continuously mounted lanes, got ${continuous.size}`);
  for (const id of continuous) {
    assert(before.lanes[id]?.mounts, `${id}: Profiler must have recorded a mount`);
    assert.equal(after.lanes[id]?.mounts, before.lanes[id]?.mounts, `${id}: continuously mounted`);
    assert.equal(
      after.lanes[id]?.updates,
      before.lanes[id]?.updates,
      `${id}: zero LaneRow updates`,
    );
  }
  // A real content change must make the same instrumentation detect updates.
  await click('Highlight rule (fresh source)');
  const changed = await profileStats();
  assert(
    [...continuous].some(
      (id) => (changed.lanes[id]?.updates ?? 0) > (after.lanes[id]?.updates ?? 0),
    ),
    'LaneRow Profiler must detect a highlight update',
  );
  assert.deepEqual(errors, [], 'Development browser runtime errors');
  console.log(
    `LaneRow profiler: ${continuous.size} continuously mounted lanes, zero updates on the second scroll pass; mount and update controls pass.`,
  );
  await page.goto(`${server.url}gallery/interval-detail`, { waitUntil: 'networkidle' });
  await page.getByTestId('roster-lane-one').waitFor();
  await settle(page);
  const selectionBefore = await profileStats();
  const selectedLane = page.getByTestId('roster-lane-one');
  // Isolate selection from Pressable's own hover, focus, and pressed-state commits.
  // The production case above exercises the complete pointer interaction.
  await selectedLane.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        clientX: bounds.left + (bounds.width * 10) / 24,
        clientY: bounds.top + 20,
      }),
    );
  });
  await page.getByTestId('interval-detail').waitFor();
  const selectionAfter = await profileStats();
  assert(selectionBefore.lanes.one?.mounts, 'Selection row must record a mount');
  assert.equal(
    selectionAfter.lanes.one?.updates,
    selectionBefore.lanes.one?.updates,
    'Opening details must not update the mounted row',
  );
  await selectedLane.evaluate((node) => {
    const bounds = node.getBoundingClientRect();
    node.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        clientX: bounds.left + 10,
        clientY: bounds.top + 20,
      }),
    );
  });
  await page.getByTestId('interval-detail').waitFor({ state: 'hidden' });
  const dismissed = await profileStats();
  assert.equal(
    dismissed.lanes.one?.updates,
    selectionAfter.lanes.one?.updates,
    'Cell dismissal must not update the mounted row',
  );
  console.log(
    'Selection profiler: zero mounted-row updates when opening details or dismissing on a cell.',
  );
} finally {
  await page.context().tracing.stop({ path: '.cache/web-performance/trace.zip' });
  await browser.close();
  await server.stop(true);
}

async function settle(target: Page) {
  // Let LegendList finish measurement, mounting, and scroll work, including the 500 ms display sampler.
  await target.waitForTimeout(850);
}
async function click(name: string) {
  const control = page.getByRole('button', { name, exact: true });
  await control.click();
  await settle(page);
  if (
    name.startsWith('Sort:') ||
    ['UTC', 'America/Chicago', '15 min', 'Highlight rule (fresh source)'].includes(name)
  ) {
    // The shared Control reports selection through accessibilityState, not paint.
    assert.equal(await control.getAttribute('aria-selected'), 'true', `${name}: selected control`);
  }
}
async function scrollRange(afterScroll?: () => Promise<void>) {
  for (const y of [240, 480, 720, 480, 240, 0]) {
    await page.getByTestId('roster-vertical-scroll').evaluate((node, top) => {
      node.scrollTop = top;
    }, y);
    await settle(page);
    assert.equal(
      await page.getByTestId('roster-vertical-scroll').evaluate((node) => node.scrollTop),
      y,
    );
    await afterScroll?.();
  }
}
async function counters() {
  return page.evaluate(() => {
    const bridge = window.__roster as CounterBridgeInput;
    if (!bridge.expandStats) throw new Error('Missing expansion bridge');
    return {
      layout: bridge.layoutStats(),
      coverage: bridge.coverageStats(),
      expand: bridge.expandStats(),
    };
  });
}
async function row(
  name: string,
  action: () => Promise<void>,
  expected: { expanded: number; layout?: number; coverage?: number },
) {
  await page.evaluate(() => {
    window.__roster?.resetStats();
    window.__roster?.resetExpandStats?.();
  });
  await action();
  const actual = await counters();
  console.log(`${name}: ${JSON.stringify(actual)}`);
  assert.equal(actual.expand.expanded, expected.expanded, `${name}: expanded`);
  assert.equal(actual.expand.cacheMisses, expected.expanded, `${name}: expansion misses`);
  assert.equal(
    actual.expand.cacheHits,
    actual.expand.rules + actual.expand.dates - expected.expanded,
    `${name}: expansion hits`,
  );
  if (expected.layout !== undefined)
    assert.equal(actual.layout.runs, expected.layout, `${name}: layout runs`);
  if (expected.coverage !== undefined)
    assert.equal(actual.coverage.runs, expected.coverage, `${name}: coverage runs`);
}

async function mountedIds() {
  return page
    .locator('[data-testid^="roster-lane-lane-"]')
    .evaluateAll((nodes) =>
      nodes.map((node) =>
        (node.getAttribute('data-testid') as string).slice('roster-lane-'.length),
      ),
    );
}
async function profileStats() {
  return page.evaluate(() => {
    const profile = window.__roster?.profileStats?.();
    if (!profile) throw new Error('Missing development Profiler counters');
    return profile;
  });
}
