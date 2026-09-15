import { useState } from 'react';
import type { AttendanceInteractionKind } from './attendance-interaction.types';

/** Interaction belongs to this event detail, independently of roster selection. */
export function useActiveAttendance() {
  const [interactions, setInteractions] = useState<
    Record<AttendanceInteractionKind, string | null>
  >({
    hover: null,
    focus: null,
    press: null,
  });
  const activeId = interactions.focus ?? interactions.hover ?? interactions.press;
  function show(id: string, interaction: AttendanceInteractionKind) {
    setInteractions((current) => ({ ...current, [interaction]: id }));
  }
  function hide(id: string, interaction: AttendanceInteractionKind) {
    setInteractions((current) =>
      current[interaction] === id ? { ...current, [interaction]: null } : current,
    );
  }
  return { activeId, show, hide };
}
