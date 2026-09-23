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
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors: string[] = [];
page.on('pageerror', (error) => errors.push(error.message));
await page.context().tracing.start({ screenshots: true, snapshots: true });
try {
  await page.goto(`${server.url}gallery/200-lanes`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__roster?.expandStats);
  await page.getByTestId('roster-vertical-scroll').waitFor();
  const labels = page.getByTestId('roster-labels');
  const labelClip = labels.locator('..');
  const labelFocused = await labels.evaluate((node) => {
    const target = node.lastElementChild as HTMLElement | null;
    if (!target) throw new Error('Missing last lane label');
    target.tabIndex = 0;
    target.focus();
    return document.activeElement === target;
  });
  await settle(page);
  assert(labelFocused, 'Last lane label must receive focus');
  const labelClipScrollTop = await labelClip.evaluate((node) => node.scrollTop);
  const header = page.getByTestId('roster-header');
  const headerClip = header.locator('..');
  const headerFocused = await header.evaluate((node) => {
    const target = node.lastElementChild as HTMLElement | null;
    if (!target) throw new Error('Missing last header cell');
    target.tabIndex = 0;
    target.focus();
    return document.activeElement === target;
  });
  await settle(page);
  assert(headerFocused, 'Last header cell must receive focus');
  const headerClipScrollLeft = await headerClip.evaluate((node) => node.scrollLeft);
  console.log(`Focus offsets: labels ${labelClipScrollTop}px; header ${headerClipScrollLeft}px.`);
  assert.deepEqual(
    { labelClipScrollTop, headerClipScrollLeft },
    { labelClipScrollTop: 0, headerClipScrollLeft: 0 },
  );
  await assertLaneLabelAlignment(0);
  assert.equal(
    await page.getByTestId('roster-horizontal-scroll').evaluate((node) => node.scrollLeft),
    0,
  );
  // Fix W's physical viewport at 24 rows without altering the roster implementation.
  const height = await page
    .getByTestId('roster-vertical-scroll')
    .evaluate((node) => node.clientHeight);
  await page.setViewportSize({ width: 1440, height: 900 + 24 * 48 - height });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__roster?.expandStats);
  await settle(page);
  assert.equal(
    await page.getByTestId('roster-vertical-scroll').evaluate((node) => node.clientHeight),
    24 * 48,
  );
  const vertical = page.getByTestId('roster-vertical-scroll');
  await vertical.hover();
  await page.mouse.wheel(0, 240);
  await settle(page);
  const focusedScrollTop = await vertical.evaluate((node) => node.scrollTop);
  assert(focusedScrollTop > 0, 'Wheel must scroll the focused-label roster');
  await assertLaneLabelAlignment(Math.round(focusedScrollTop / 48));
  await vertical.evaluate((node) => {
    node.scrollTop = 0;
  });
  await settle(page);
  await labelClip.hover();
  await page.mouse.wheel(0, 240);
  await settle(page);
  const labelWheelTop = await vertical.evaluate((node) => node.scrollTop);
  assert.equal(labelWheelTop, focusedScrollTop, 'Label wheel must match body wheel scrolling');
  await assertLaneLabelAlignment(Math.round(labelWheelTop / 48));
  await page.mouse.wheel(240, 0);
  await settle(page);
  assert.equal(await labelClip.evaluate((node) => node.scrollLeft), 0);
  assert.equal(await vertical.evaluate((node) => node.scrollTop), labelWheelTop);
  await page.mouse.wheel(0, -240);
  await settle(page);
  assert.equal(await vertical.evaluate((node) => node.scrollTop), 0);
  await assertLaneLabelAlignment(0);
  console.log(
    'Label wheel: body-matching vertical scrolling, reverse scrolling, and aligned labels.',
  );
  console.log(
    'Focus clipping: labels stay aligned before and after wheel scrolling; header offset stays zero.',
  );
  const sixtyMinuteChoice = page.getByRole('radio', { name: '60 min', exact: true });
  await click('15 min');
  assert.equal(
    await sixtyMinuteChoice.getAttribute('aria-checked'),
    'false',
    '15 min activation must uncheck 60 min',
  );
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
  assert.equal(
    await page.getByRole('radio', { name: 'UTC', exact: true }).getAttribute('aria-checked'),
    'false',
    'America/Chicago activation must uncheck UTC',
  );
  // Edit while back at the original absolute window so unchanged rules retain exact envelope keys.
  await click('UTC');
  assert.equal(
    await page
      .getByRole('radio', { name: 'America/Chicago', exact: true })
      .getAttribute('aria-checked'),
    'false',
    'UTC activation must uncheck America/Chicago',
  );
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
  assert.equal(
    await page
      .getByRole('radio', { name: 'Sort: label', exact: true })
      .getAttribute('aria-checked'),
    'false',
    'Sort availability activation must uncheck Sort label',
  );
  await click('Sort: label');
  assert.equal(
    await page
      .getByRole('radio', { name: 'Sort: availability', exact: true })
      .getAttribute('aria-checked'),
    'false',
    'Sort label activation must uncheck Sort availability',
  );
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
  const intervalActions = detailLane.getByRole('button', { name: /Open hours interval/ });
  assert.equal(await intervalActions.count(), 2, 'Both interval pieces must be keyboard targets');
  const firstIntervalAction = intervalActions.nth(0);
  await firstIntervalAction.focus();
  await page.keyboard.press('Enter');
  await page.getByTestId('interval-detail').waitFor();
  assert.match(await page.getByTestId('interval-detail').innerText(), /Lane one/);
  await page.screenshot({ path: '.cache/web-performance/keyboard-interval-detail.png' });
  await page.keyboard.press('Escape');
  await page.getByTestId('interval-detail').waitFor({ state: 'hidden' });
  assert.equal(
    await firstIntervalAction.evaluate((node) => document.activeElement === node),
    true,
    'Escape must restore the exact interval target',
  );
  const secondIntervalAction = intervalActions.nth(1);
  await secondIntervalAction.focus();
  await page.keyboard.press('Space');
  await page.getByTestId('interval-detail').waitFor();
  assert.match(await page.getByTestId('interval-detail').innerText(), /6:00 PM to .*8:00 PM/);
  await page.keyboard.press('Escape');
  await page.getByTestId('interval-detail').waitFor({ state: 'hidden' });
  let laneWidth = await detailLane.evaluate((node) => node.clientWidth);
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
  const outsideButton = page.getByRole('button', { name: 'Next', exact: true });
  await outsideButton.click();
  await page.getByTestId('interval-detail').waitFor({ state: 'hidden' });
  assert.equal(await outsideButton.evaluate((node) => document.activeElement === node), true);
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await detailLane.click({ position: { x: (laneWidth * 10) / 24, y: 20 } });
  await page.getByTestId('interval-detail').waitFor();
  await page.keyboard.press('Escape');
  await page.getByTestId('interval-detail').waitFor({ state: 'hidden' });
  assert.equal(
    await page.getByTestId('interval-detail').count(),
    0,
    'Escape must close selection while body presses are excluded from outside dismissal',
  );
  await page.waitForFunction(() =>
    document.activeElement?.getAttribute('aria-label')?.startsWith('Lane one:'),
  );
  await detailLane.click({ position: { x: (laneWidth * 10) / 24, y: 20 } });
  await page.getByTestId('interval-detail').waitFor();
  const secondDetailLane = page.getByTestId('roster-lane-two');
  await secondDetailLane.click({ position: { x: (laneWidth * 16) / 24, y: 20 } });
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="interval-detail"]')?.textContent?.includes('Lane two'),
  );
  await page.keyboard.press('Escape');
  await page.getByTestId('interval-detail').waitFor({ state: 'hidden' });
  await page.waitForFunction(() =>
    document.activeElement?.getAttribute('aria-label')?.startsWith('Lane two:'),
  );
  await page.setViewportSize({ width: 600, height: 900 });
  await settle(page);
  laneWidth = await detailLane.evaluate((node) => node.clientWidth);
  const horizontal = page.getByTestId('roster-horizontal-scroll');
  await horizontal.evaluate((node) => {
    node.scrollLeft = 80;
  });
  await settle(page);
  assert.equal(await horizontal.evaluate((node) => node.scrollLeft), 80);
  await detailLane.click({ position: { x: (laneWidth * 10) / 24, y: 20 } });
  await page.getByTestId('interval-detail').waitFor();
  await page.getByRole('button', { name: 'Show inspector', exact: true }).click();
  await settle(page);
  assert.equal(await horizontal.evaluate((node) => node.scrollLeft), 80);
  assert.equal(
    await page
      .getByTestId('roster-header')
      .evaluate((node) => -new DOMMatrixReadOnly(getComputedStyle(node).transform).m41),
    80,
  );
  await page.getByRole('button', { name: 'Show popover', exact: true }).click();
  await page.getByTestId('interval-detail').waitFor();
  await settle(page);
  const target = await page.getByTestId('roster-selection-target').boundingBox();
  const laneBounds = await detailLane.boundingBox();
  assert(target && laneBounds);
  assert(
    Math.abs(target.x - (laneBounds.x + (laneWidth * 9) / 24)) < 1,
    'Selection target must follow the interval after restoring horizontal scroll',
  );
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 1600 });
  await settle(page);
  laneWidth = await detailLane.evaluate((node) => node.clientWidth);
  await page.getByRole('button', { name: 'Show inspector', exact: true }).click();
  await detailLane.click({ position: { x: (laneWidth * 10) / 24, y: 20 } });
  await page.getByTestId('interval-detail').waitFor();
  await page.getByRole('button', { name: 'Close details', exact: true }).click();
  await page.getByTestId('interval-detail').waitFor({ state: 'hidden' });
  assert.deepEqual(errors, [], 'Selection browser runtime errors');
  console.log(
    'Selection: dismissal, keyboard focus return, outside pointer focus, and scroll alignment across layout switches pass.',
  );
  await assertShowcaseWeekAxes();
  await page.goto(`${server.url}gallery/schedule-layers`, { waitUntil: 'networkidle' });
  const dayHeader = page.getByRole('button', { name: '2024-01-01', exact: true });
  await dayHeader.click();
  await assertDayActivations(1);
  await dayHeader.focus();
  await page.keyboard.press('Enter');
  await assertDayActivations(2);
  await page.keyboard.press('Space');
  await assertDayActivations(3);
  const scheduleInterval = page.getByRole('button', {
    name: /Schedule: overlapping rules and three sessions: booking interval.*sources 1/,
  });
  await scheduleInterval.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="roster-selection"]')?.textContent ===
      '[{"kind":"session","id":"1"}]',
  );
  await page.keyboard.press('Space');
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="roster-selection"]')?.textContent ===
      '[{"kind":"session","id":"1"}]',
  );
  assert.deepEqual(errors, [], 'Day header browser runtime errors');
  console.log(
    'Keyboard targets: Enter and Space activate exact Roster and Schedule rects; Escape restores interval focus.',
  );
  await page.goto(`${server.url}gallery/every-zone`, { waitUntil: 'networkidle' });
  const nowToggle = page.getByRole('button', { name: 'Now at window midpoint', exact: true });
  assert.equal(await nowToggle.getAttribute('aria-pressed'), 'false', 'Now: unpressed control');
  await click('Now at window midpoint');
  const nextAction = page.getByRole('button', { name: 'Next', exact: true });
  assert.equal(await nextAction.getAttribute('aria-pressed'), null, 'Next: ordinary action');
  assert.equal(await nextAction.getAttribute('aria-selected'), null, 'Next: unselected action');
  assert.equal(await nextAction.getAttribute('aria-checked'), null, 'Next: unchecked action');
  for (const groupName of ['Span', 'Minute step', 'Timezone', 'Sort']) {
    const group = page.getByRole('radiogroup', { name: groupName, exact: true });
    assert.equal(await group.count(), 1, `${groupName}: one named radio group`);
    assert.equal(
      await group.getByRole('radio', { checked: true }).count(),
      1,
      `${groupName}: one checked choice`,
    );
  }
  await page.goto(`${server.url}gallery/schedule-every-zone`, { waitUntil: 'networkidle' });
  for (const groupName of ['Zone style', 'Span', 'Minute step', 'Scale', 'Timezone', 'View']) {
    const group = page.getByRole('radiogroup', { name: groupName, exact: true });
    assert.equal(await group.count(), 1, `${groupName}: one named radio group`);
    assert.equal(
      await group.getByRole('radio', { checked: true }).count(),
      1,
      `${groupName}: one checked choice`,
    );
  }
  assert.deepEqual(errors, [], 'Toggle browser runtime errors');
  console.log(
    'Control semantics: fixture choices are named radios, persistent controls are pressed, and actions remain buttons.',
  );
  await page.setViewportSize({ width: 1440, height: 1600 });
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
async function assertDayActivations(count: number) {
  await page.waitForFunction(
    (expected) =>
      document.querySelector('[data-testid="roster-selection"]')?.textContent ===
      `Day 2024-01-01 (${expected} activations)`,
    count,
  );
}
async function assertLaneLabelAlignment(index: number) {
  const label = page.getByTestId('roster-labels').locator(':scope > *').nth(index);
  const labelText = await label.innerText();
  const laneId = labelText.match(/^Lane (\d+)/)?.[1];
  assert(laneId, `Label ${index} must identify its lane`);
  const lane = page.getByTestId(`roster-lane-lane-${laneId}`);
  const [labelBounds, laneBounds] = await Promise.all([label.boundingBox(), lane.boundingBox()]);
  assert(labelBounds && laneBounds, `Lane ${index} and its label must be mounted`);
  assert(
    Math.abs(labelBounds.y - laneBounds.y) < 1,
    `Lane ${index} label must stay aligned: ${labelBounds.y} versus ${laneBounds.y}`,
  );
}
async function click(name: string) {
  const exclusive = name.startsWith('Sort:') || ['UTC', 'America/Chicago', '15 min'].includes(name);
  const control = page.getByRole(exclusive ? 'radio' : 'button', { name, exact: true });
  await control.click();
  await settle(page);
  if (exclusive) {
    assert.equal(await control.getAttribute('aria-checked'), 'true', `${name}: checked choice`);
  }
  if (['Highlight rule (fresh source)', 'Now at window midpoint'].includes(name)) {
    assert.equal(await control.getAttribute('aria-pressed'), 'true', `${name}: pressed control`);
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

async function assertShowcaseWeekAxes() {
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto(`${server.url}showcase`, { waitUntil: 'networkidle' });
  await page.getByRole('radio', { name: 'Week', exact: true }).click();
  await settle(page);

  for (const [density, width] of [
    ['full', 1100],
    ['compact', 800],
    ['avatar', 500],
  ] as const) {
    await page.setViewportSize({ width, height: 900 });
    await settle(page);
    const horizontal = page.getByTestId('roster-horizontal-scroll');
    const offset = await horizontal.evaluate((node) => {
      node.scrollLeft = Math.floor((node.scrollWidth - node.clientWidth) / 2);
      return node.scrollLeft;
    });
    await settle(page);
    assert(offset > 0, `${density}: detailed week must scroll horizontally`);
    const visibleLabels = await page.getByTestId('roster-header').evaluate((node) => {
      const clip = node.parentElement?.getBoundingClientRect();
      if (!clip) throw new Error('Missing roster header clip');
      return [...node.querySelectorAll('*')]
        .filter((child) => {
          const bounds = child.getBoundingClientRect();
          return bounds.width > 0 && bounds.right > clip.left && bounds.left < clip.right;
        })
        .map((child) => child.textContent?.trim() ?? '')
        .filter(Boolean);
    });
    assert(
      visibleLabels.some((label) =>
        /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}\b/.test(label),
      ),
      `${density}: scrolled detailed week must retain visible date context: ${JSON.stringify(visibleLabels)}`,
    );
  }

  await page.setViewportSize({ width: 800, height: 900 });
  await page.getByRole('button', { name: 'Previous week', exact: true }).click();
  await settle(page);
  assert.match(
    await page.getByText(/2025 to .*2026/).innerText(),
    /2025 to .*2026/,
    'Cross-year week must expose both years',
  );
  await page.getByRole('button', { name: 'Return to demo week', exact: true }).click();
  await settle(page);
  await page.setViewportSize({ width: 1100, height: 900 });
  await settle(page);

  for (const [label, nextCount] of [
    ['normal', 0],
    ['spring-forward', 8],
    ['fall-back', 34],
  ] as const) {
    for (let index = 0; index < nextCount; index += 1)
      await page.getByRole('button', { name: 'Next week', exact: true }).click();
    await settle(page);
    const horizontal = page.getByTestId('roster-horizontal-scroll');
    const detailed = await horizontal.evaluate((node) => node.scrollWidth);
    await page.getByRole('radio', { name: 'Fitted', exact: true }).click();
    await settle(page);
    const fitted = await horizontal.evaluate((node) => node.scrollWidth);
    assert(
      fitted < detailed,
      `${label}: fitted week must not retain detailed width: ${fitted} versus ${detailed}`,
    );
    await page.getByRole('radio', { name: 'Detailed', exact: true }).click();
    await settle(page);
  }
  await page.screenshot({ path: '.cache/web-performance/showcase-week-axes.png' });
  assert.deepEqual(errors, [], 'Showcase browser runtime errors');
  console.log(
    'Showcase week axes: scrolled full, compact, and avatar date context; cross-year years; normal, spring-forward, and fall-back fitted widths pass.',
  );
}
