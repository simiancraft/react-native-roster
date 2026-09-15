import { useState } from 'react';

/** Interaction belongs to this chart, independently of roster selection. */
export function useAttendanceTooltip() {
  const [activeId, setActiveId] = useState<string | null>(null);
  function show(id: string) {
    setActiveId(id);
  }
  function hide(id: string) {
    setActiveId((current) => (current === id ? null : current));
  }
  function toggle(id: string) {
    setActiveId((current) => (current === id ? null : id));
  }
  return { activeId, show, hide, toggle };
}
