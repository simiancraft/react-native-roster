import { faker } from '@faker-js/faker';
import type { Interval, Lane, Layer, Weekday, Window } from 'react-native-roster/core';
import type { expandRuleSet, RuleSet } from 'react-native-roster/rrule';

export type EventKind = 'meeting' | 'focus' | 'session';
export type Member = {
  id: string;
  name: string;
  initials: string;
  role: string;
  team: string;
  timezone: string;
  /** Tailwind color family used by the label avatar and the availability band. */
  tone: 'emerald' | 'sky' | 'violet' | 'amber' | 'rose' | 'teal';
  workdays: Weekday[];
  hours: { start: number; end: number };
  rules: RuleSet;
};
export type MemberEvent = {
  id: string;
  kind: EventKind;
  title: string;
  start: number;
  end: number;
};
export type MemberLaneMeta = { member: Member; events: MemberEvent[] };

const TIMEZONES = [
  'America/Chicago',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Australia/Sydney',
];
const TONES: Member['tone'][] = ['emerald', 'sky', 'violet', 'amber', 'rose', 'teal'];
const WEEKDAYS: Weekday[] = [0, 1, 2, 3, 4];
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** A deterministic team; the same seed always yields the same people. */
export function teamFor(seed = 1318, count = 12): Member[] {
  faker.seed(seed);
  const members: Member[] = [];
  for (let index = 0; index < count; index++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const workdays = faker.helpers.arrayElement([
      WEEKDAYS,
      WEEKDAYS,
      WEEKDAYS,
      [0, 1, 2, 3] as Weekday[],
      [1, 2, 3, 4] as Weekday[],
      [0, 2, 4] as Weekday[],
    ]);
    const hours = faker.helpers.arrayElement([
      { start: 9, end: 17 },
      { start: 9, end: 17 },
      { start: 8, end: 16 },
      { start: 10, end: 18 },
      { start: 13, end: 21 },
      { start: 7, end: 15 },
    ]);
    const timezone = faker.helpers.arrayElement(TIMEZONES);
    const id = `member-${index}`;
    const dtstart = '2024-01-01';
    const pto = faker.date.between({ from: '2026-08-24', to: '2026-10-04' });
    const rules: RuleSet = {
      rules: [
        {
          id: `${id}:hours`,
          kind: 'include',
          frequency: 'WEEKLY',
          dtstart,
          byweekday: workdays,
          hourstart: hours.start,
          hourend: hours.end,
          timezone,
        },
        {
          id: `${id}:lunch`,
          kind: 'exclude',
          frequency: 'WEEKLY',
          dtstart,
          byweekday: workdays,
          hourstart: hours.start + 3.5,
          hourend: hours.start + 4.5,
          timezone,
        },
      ],
      dates: [
        {
          id: `${id}:pto`,
          kind: 'exclude',
          date: pto.toISOString().slice(0, 10),
          timezone,
          note: 'Out of office',
        },
      ],
    };
    members.push({
      id,
      name: `${firstName} ${lastName}`,
      initials: `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase(),
      role: faker.person.jobTitle(),
      team: faker.helpers.arrayElement(['Platform', 'Design', 'Support', 'Growth', 'Data']),
      timezone,
      tone: TONES[index % TONES.length] ?? 'emerald',
      workdays,
      hours,
      rules,
    });
  }
  return members;
}

const EVENT_TITLES: Record<EventKind, () => string> = {
  meeting: () =>
    faker.helpers.arrayElement([
      `Sync with ${faker.person.firstName()}`,
      `${faker.company.buzzNoun()} review`,
      `1:1 with ${faker.person.firstName()}`,
      `${faker.commerce.department()} standup`,
      'Roadmap check-in',
    ]),
  focus: () =>
    faker.helpers.arrayElement([
      `Focus: ${faker.hacker.verb()} ${faker.hacker.noun()}`,
      'Deep work',
      `Draft ${faker.company.buzzNoun()} doc`,
    ]),
  session: () =>
    faker.helpers.arrayElement([
      `Session with ${faker.person.firstName()}`,
      `Onboarding: ${faker.person.firstName()}`,
      `Office hours`,
    ]),
};

/** Events for one member inside a window, stable for the same member and window. */
export function eventsFor(member: Member, window: Window): MemberEvent[] {
  const seed = hashSeed(`${member.id}:${window.start}`);
  faker.seed(seed);
  const events: MemberEvent[] = [];
  const dayCount = Math.round((window.end - window.start) / DAY);
  const localMidnight = new Intl.DateTimeFormat('en-US', {
    timeZone: member.timezone,
    hour: '2-digit',
    hourCycle: 'h23',
  });
  for (let day = 0; day < dayCount; day++) {
    const dayStart = window.start + day * DAY;
    // Offset the member's local wall clock against the window's UTC day boundary.
    const localHour = Number(localMidnight.format(dayStart));
    const weekday = ((new Date(dayStart).getUTCDay() + 6) % 7) as Weekday;
    if (!member.workdays.includes(weekday)) continue;
    const perDay = faker.number.int({ min: 1, max: 3 });
    const slots = faker.helpers.uniqueArray(
      () => faker.number.int({ min: member.hours.start, max: member.hours.end - 2 }),
      perDay,
    );
    for (const hour of slots) {
      const kind = faker.helpers.weightedArrayElement<EventKind>([
        { weight: 5, value: 'meeting' },
        { weight: 3, value: 'focus' },
        { weight: 2, value: 'session' },
      ]);
      const length = kind === 'focus' ? 2 : faker.helpers.arrayElement([0.5, 1, 1, 1.5]);
      const start = dayStart + (hour - localHour) * HOUR;
      const end = start + length * HOUR;
      if (start < window.start || end > window.end) continue;
      events.push({
        id: `${member.id}:${day}:${hour}`,
        kind,
        title: EVENT_TITLES[kind](),
        start,
        end,
      });
    }
  }
  return events.sort((a, b) => a.start - b.start);
}

export function laneFor(
  member: Member,
  window: Window,
  expand: typeof expandRuleSet,
  tone: (member: Member) => string,
): Lane {
  const expansion = expand(member.rules, window);
  const events = eventsFor(member, window);
  const availability: Layer = {
    id: 'availability',
    role: 'availability',
    z: 0,
    style: { color: tone(member) },
    intervals: expansion.intervals,
    gaps: expansion.gaps,
    label: 'Working hours',
  };
  const bookings: Layer = {
    id: 'events',
    role: 'booking',
    z: 1,
    style: { color: '#38bdf8', inset: 6 },
    intervals: events.map<Interval>((event) => ({
      start: event.start,
      end: event.end,
      sources: [{ kind: event.kind, id: event.id, label: event.title }],
    })),
    label: 'Events',
  };
  return {
    id: member.id,
    label: member.name,
    timezone: member.timezone,
    complete: expansion.complete,
    version: `${window.start}:${window.end}`,
    layers: [availability, bookings],
    meta: { member, events } satisfies MemberLaneMeta,
  };
}

export function memberMeta(lane: Lane): MemberLaneMeta {
  return lane.meta as MemberLaneMeta;
}

function hashSeed(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
