import type { EventKind, Member } from './team';

/** Literal class tables so Tailwind's scanner emits every variant. */
export const TONE_CLASSES: Record<
  Member['tone'],
  { avatar: string; avatarText: string; band: string; ring: string }
> = {
  emerald: {
    avatar: 'bg-emerald-500/20',
    avatarText: 'text-emerald-300',
    band: 'bg-emerald-500/15 border-emerald-500/40',
    ring: 'border-emerald-400',
  },
  sky: {
    avatar: 'bg-sky-500/20',
    avatarText: 'text-sky-300',
    band: 'bg-sky-500/15 border-sky-500/40',
    ring: 'border-sky-400',
  },
  violet: {
    avatar: 'bg-violet-500/20',
    avatarText: 'text-violet-300',
    band: 'bg-violet-500/15 border-violet-500/40',
    ring: 'border-violet-400',
  },
  amber: {
    avatar: 'bg-amber-500/20',
    avatarText: 'text-amber-300',
    band: 'bg-amber-500/15 border-amber-500/40',
    ring: 'border-amber-400',
  },
  rose: {
    avatar: 'bg-rose-500/20',
    avatarText: 'text-rose-300',
    band: 'bg-rose-500/15 border-rose-500/40',
    ring: 'border-rose-400',
  },
  teal: {
    avatar: 'bg-teal-500/20',
    avatarText: 'text-teal-300',
    band: 'bg-teal-500/15 border-teal-500/40',
    ring: 'border-teal-400',
  },
};

export const TONE_HEX: Record<Member['tone'], string> = {
  emerald: '#10b981',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  teal: '#14b8a6',
};

export const KIND_CLASSES: Record<
  EventKind,
  { card: string; title: string; time: string; dot: string; label: string }
> = {
  meeting: {
    card: 'bg-sky-500 border-sky-300/60',
    title: 'text-sky-950',
    time: 'text-sky-900/80',
    dot: 'bg-sky-400',
    label: 'Meeting',
  },
  focus: {
    card: 'bg-violet-500 border-violet-300/60',
    title: 'text-violet-950',
    time: 'text-violet-900/80',
    dot: 'bg-violet-400',
    label: 'Focus block',
  },
  session: {
    card: 'bg-emerald-400 border-emerald-200/60',
    title: 'text-emerald-950',
    time: 'text-emerald-900/80',
    dot: 'bg-emerald-400',
    label: 'Session',
  },
};

export function eventKindOf(kind: string): EventKind {
  return kind === 'focus' || kind === 'session' ? kind : 'meeting';
}
