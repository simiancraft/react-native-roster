import { useState } from 'react';

/** Interaction belongs to this event detail, independently of roster selection. */
export function useActiveAttendance() {
  const [activeId, setActiveId] = useState<string | null>(null);
  function show(id: string) {
    setActiveId(id);
  }
  function hide(id: string) {
    setActiveId((current) => (current === id ? null : current));
  }
  return { activeId, show, hide };
}
