import type { Coverage, Lane } from 'react-native-roster/core';
import type { AttendanceMeta } from '../attendance.types';

export function attendanceMeta(lane: Lane): AttendanceMeta {
  return lane.meta as AttendanceMeta;
}

export function attendanceMinutes(coverage: Coverage): AttendanceMeta['minutes'] {
  return {
    present: coverage.availabilityMinutes,
    together: coverage.availabilityMinutes - coverage.availabilityMinusBookingMinutes,
    dead: coverage.availabilityMinusBookingMinutes,
  };
}
