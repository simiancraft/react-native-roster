import type { Attendance } from '../../demo/components/attendance/attendance.types';

const start = Date.UTC(2026, 0, 5, 7);
const end = start + 90 * 60_000;
const plan = { start, end };
const timezone = 'UTC';

export const attendanceFixtures = [
  {
    id: 'full',
    title: 'Morning standup',
    kind: 'standup',
    plan,
    timezone,
    description: 'On time, with the full 90 minutes together.',
    attendees: [
      { id: 'ada', name: 'Ada Finch', presence: [{ start, end }] },
      { id: 'ivo', name: 'Ivo Reed', presence: [{ start, end }] },
      { id: 'nia', name: 'Nia Vale', presence: [{ start, end }] },
    ],
  },
  {
    id: 'short',
    title: 'Materials workshop',
    kind: 'workshop',
    plan,
    timezone,
    description: 'One arrival 10 minutes late; one departure 15 minutes early.',
    attendees: [
      { id: 'ada', name: 'Ada Finch', presence: [{ start, end }] },
      { id: 'ivo', name: 'Ivo Reed', presence: [{ start: start + 10 * 60_000, end }] },
      {
        id: 'nia',
        name: 'Nia Vale',
        presence: [
          { start, end: start + 40 * 60_000 },
          { start: start + 50 * 60_000, end: end - 15 * 60_000 },
        ],
      },
    ],
  },
  {
    id: 'missed',
    title: 'Prototype review',
    kind: 'review',
    plan,
    timezone,
    description: 'Two attendees, separated by a 10-minute gap.',
    attendees: [
      { id: 'ada', name: 'Ada Finch', presence: [{ start, end: start + 40 * 60_000 }] },
      { id: 'ivo', name: 'Ivo Reed', presence: [{ start: start + 50 * 60_000, end }] },
    ],
  },
] satisfies Attendance[];
