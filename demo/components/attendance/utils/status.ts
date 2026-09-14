import type { Window } from 'react-native-roster/core';
import type { AttendanceStatus } from '../attendance.types';
import { overlap } from './overlap';

/** Missed means no presence during the current together block; apart mode marks all attendees missed. */
export function statusFor(
  presence: Window | null,
  plan: Window,
  together: Window | null,
): AttendanceStatus {
  if (!presence || !together || !overlap([presence, together])) return 'missed';
  if (presence.start > plan.start && presence.end < plan.end) return 'late-and-left-early';
  if (presence.start > plan.start) return 'late';
  if (presence.end < plan.end) return 'left-early';
  return 'on-time';
}
