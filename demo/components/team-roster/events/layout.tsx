import type { ReactNode } from 'react';
import { Card } from '../../ui/card';

export function EventLayout({
  headerZone,
  chartZone,
  footerZone,
}: {
  /** Title, scheduled time range, zone, and description. */
  headerZone: ReactNode;
  /** Shared axis, tick lines, scheduled band, and compact attendance rows. */
  chartZone: ReactNode;
  /** Attendance legend or the active row’s detail sentence. */
  footerZone: ReactNode;
}) {
  return (
    <Card
      className="w-[380px] max-w-full gap-3 p-3"
      contentZone={
        <>
          {headerZone}
          {chartZone}
          {footerZone}
        </>
      }
    />
  );
}
