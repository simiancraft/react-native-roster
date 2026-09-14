import type { ReactNode } from 'react';
import { View } from 'react-native';

type AttendanceLayoutProps = {
  /** Attendance title, kind, and planned bounds. */
  titleZone: ReactNode;
  /** Everyone and designated-anchor controls. */
  controlsZone: ReactNode;
  /** The public Roster with attendee lanes. */
  rosterZone: ReactNode;
  /** Color and dead-time explanations. */
  legendZone: ReactNode;
  /** Together summary or the no-overlap notice. */
  noticeZone: ReactNode;
};

export function AttendanceLayout({
  titleZone,
  controlsZone,
  rosterZone,
  legendZone,
  noticeZone,
}: AttendanceLayoutProps) {
  return (
    <View className="min-w-0 gap-4 rounded-2xl border border-border bg-card p-4">
      {titleZone}
      {controlsZone}
      {noticeZone}
      <View className="min-h-[136px]">{rosterZone}</View>
      {legendZone}
    </View>
  );
}
