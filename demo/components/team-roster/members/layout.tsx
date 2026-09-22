import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Card } from '../../ui/card';

type MemberInspectorLayoutProps = {
  /** Avatar, name, role, and team. */
  identityZone: ReactNode;
  /** Small facts about the member: hours, zone, days per week. */
  factsZone: ReactNode;
  /** What was pressed: an event, time off, an open slot, or a prompt. */
  selectionZone: ReactNode;
  /** The member's week as a Schedule; fills the remaining height. */
  scheduleZone: ReactNode;
};

export function MemberInspectorLayout({
  identityZone,
  factsZone,
  selectionZone,
  scheduleZone,
}: MemberInspectorLayoutProps) {
  return (
    <Card
      className="flex-1 min-h-0 gap-3 p-3"
      contentZone={
        <>
          {identityZone}
          <View className="flex-row flex-wrap gap-2">{factsZone}</View>
          {selectionZone}
          <View className="flex-1 min-h-0">{scheduleZone}</View>
        </>
      }
    />
  );
}
