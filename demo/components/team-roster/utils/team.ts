import { en, Faker } from '@faker-js/faker';
import {
  type Interval,
  type Lane,
  type Layer,
  type Weekday,
  type Window,
  windowFor,
} from 'react-native-roster/core';
import type { expandRuleSet, RuleSet } from 'react-native-roster/rrule';
import type { Attendance, EventKind, MemberEvent } from '../events/event.types';
import type { Member, MemberLaneMeta } from '../members/member.types';
import type { Team } from '../team-roster.types';

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

/** A private generator so render-time calls never touch shared random state. */
function generator(seed: number): Faker {
  const faker = new Faker({ locale: [en] });
  faker.seed(seed);
  return faker;
}

/** A deterministic team; the same seed always yields the same people. */
export function teamFor(seed = 1318, count = 12): Team {
  const faker = generator(seed);
  const organization = faker.company.name();
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
  return { organization, members };
}

const EVENT_TITLES: Record<EventKind, (faker: Faker) => string> = {
  meeting: (faker) =>
    faker.helpers.arrayElement([
      `Sync with ${faker.person.firstName()}`,
      `${faker.company.buzzNoun()} review`,
      `1:1 with ${faker.person.firstName()}`,
      `${faker.commerce.department()} standup`,
      'Roadmap check-in',
    ]),
  focus: (faker) =>
    faker.helpers.arrayElement([
      `Focus: ${faker.hacker.verb()} ${faker.hacker.noun()}`,
      'Deep work',
      `Draft ${faker.company.buzzNoun()} doc`,
    ]),
  session: (faker) =>
    faker.helpers.arrayElement([
      `Session with ${faker.person.firstName()}`,
      `Onboarding: ${faker.person.firstName()}`,
      `Office hours`,
    ]),
};

/** Events for one member inside a window, stable for the same member and window. */
export function eventsFor(
  member: Member,
  window: Window,
  members: Member[] = [member],
  now = seededNow(),
): MemberEvent[] {
  const events: MemberEvent[] = [];
  if (window.end <= window.start) return events;
  const first = localDateEpoch(window.start, member.timezone);
  const last = localDateEpoch(window.end - 1, member.timezone);
  for (let date = first; date <= last; date += DAY) {
    const dateLabel = new Date(date).toISOString().slice(0, 10);
    const faker = generator(hashSeed(`${JSON.stringify(member)}:${dateLabel}`));
    const weekday = ((new Date(date).getUTCDay() + 6) % 7) as Weekday;
    if (!member.workdays.includes(weekday)) continue;
    const perDay = faker.number.int({ min: 1, max: 3 });
    const candidates: number[] = [];
    for (let hour = member.hours.start; hour <= member.hours.end - 2; hour += 2.5) {
      candidates.push(hour);
    }
    const slots = faker.helpers
      .arrayElements(candidates, Math.min(perDay, candidates.length))
      .sort((a, b) => a - b);
    for (const hour of slots) {
      const kind = faker.helpers.weightedArrayElement<EventKind>([
        { weight: 5, value: 'meeting' },
        { weight: 3, value: 'focus' },
        { weight: 2, value: 'session' },
      ]);
      const length = kind === 'focus' ? 2 : faker.helpers.arrayElement([0.5, 1, 1, 1.5]);
      const start = authoredHour(dateLabel, hour, member.timezone);
      const end = authoredHour(dateLabel, hour + length, member.timezone);

      events.push({
        id: `${member.id}:${dateLabel}:${hour}`,
        kind,
        title: EVENT_TITLES[kind](faker),
        ...attendanceFor(faker, member, members, { start, end }, now, slots.indexOf(hour)),
        start,
        end,
      });
    }
  }
  return events
    .filter((event) => event.start < window.end && event.end > window.start)
    .sort((a, b) => a.start - b.start);
}

export function laneFor(
  member: Member,
  window: Window,
  expand: typeof expandRuleSet,
  tone: (member: Member) => string,
  members: Member[] = [member],
  now = seededNow(),
): Lane {
  const expansion = expand(member.rules, window);
  const events = eventsFor(member, window, members, now);
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
      start: Math.max(event.start, window.start),
      end: Math.min(event.end, window.end),
      sources: [{ kind: event.kind, id: event.id, label: event.title }],
    })),
    label: 'Events',
  };
  return {
    id: member.id,
    label: member.name,
    timezone: member.timezone,
    complete: expansion.complete,
    layers: [availability, bookings],
    meta: { member, events, now } satisfies MemberLaneMeta,
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

/** Fixed seeded demo clock, inside the initial day in Chicago. */
export function seededNow(seed = 1318): number {
  return Date.UTC(2026, 0, 5, 18, generator(seed).number.int({ min: 0, max: 29 }));
}

function attendanceFor(
  faker: Faker,
  member: Member,
  members: Member[],
  scheduled: Window,
  now: number,
  index: number,
): Pick<MemberEvent, 'description' | 'expected' | 'attendances' | 'facts'> {
  const expected = [
    member,
    ...faker.helpers.arrayElements(
      members.filter((person) => person.id !== member.id),
      Math.min(3, members.length - 1),
    ),
  ].map(({ id, name }) => ({ id, name }));
  const description = `The group will review ${faker.company.buzzNoun()} and agree on the next steps.`;
  const shape = (Number(member.id.split('-').at(-1)) + index) % 6;
  const facts = expected.map((attendee, i) => {
    const offset = faker.number.int({ min: 5, max: 15 }) * 60_000;
    if (shape === 5 && i === 1) return { attendeeId: attendee.id, arrival: null, departure: null };
    return {
      attendeeId: attendee.id,
      arrival: scheduled.start + (shape === 1 ? offset : shape === 3 ? -offset : 0),
      departure: scheduled.end + (shape === 2 ? -offset : shape === 4 ? offset : 0),
    };
  });
  const attendances = facts.map((fact): Attendance => {
    const { attendeeId, arrival, departure } = fact;
    if (scheduled.start >= now) return { attendeeId, state: 'expected' };
    if (arrival === null || departure === null)
      return { attendeeId, state: scheduled.end > now ? 'pending' : 'absent' };
    if (arrival > now) return { attendeeId, state: 'pending' };
    if (departure > now) return { attendeeId, state: 'present', arrival };
    return { attendeeId, state: 'attended', start: arrival, end: departure };
  });
  return { description, expected, facts, attendances };
}

function localDateEpoch(time: number, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(time);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(value('year'), value('month') - 1, value('day'));
}

/** Resolve daytime authored hours using the offset at that wall time, including DST changes. */
function authoredHour(date: string, hour: number, timezone: string): number {
  const day = windowFor({ span: 'day', anchorDate: date, timezone });
  const target = Date.parse(`${date}T00:00:00Z`) + hour * HOUR;
  let instant = day.start + hour * HOUR;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = formatter.formatToParts(instant);
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const wall =
      localDateEpoch(instant, timezone) + value('hour') * HOUR + value('minute') * 60_000;
    if (wall === target) return instant;
    instant += target - wall;
  }
  return instant;
}
