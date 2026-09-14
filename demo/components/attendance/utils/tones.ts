import type { AttendanceStatus, EventKind } from '../attendance.types';

/** Semantic tokens: kinds tint the plan and detail header; statuses fill presence bars. */
export const KIND_COLORS: Record<EventKind, { label: string; fill: string }> = {
  standup: { label: 'Standup', fill: 'bg-attendance-standup' },
  workshop: { label: 'Workshop', fill: 'bg-attendance-workshop' },
  review: { label: 'Review', fill: 'bg-attendance-review' },
};
export const STATUS_COLORS: Record<AttendanceStatus, { label: string; fill: string }> = {
  'on-time': { label: 'On time', fill: 'bg-attendance-on-time' },
  late: { label: 'Late', fill: 'bg-attendance-late' },
  'left-early': { label: 'Left early', fill: 'bg-attendance-left-early' },
  'late-and-left-early': {
    label: 'Late and left early',
    fill: 'bg-attendance-late-and-left-early',
  },
  missed: { label: 'Missed', fill: 'bg-attendance-missed' },
};
