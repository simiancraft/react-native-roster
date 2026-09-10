import type { ReactNode } from 'react';

/** Wraps one card in the host's link element; the route shell decides the router. */
export type LinkZone = (input: {
  href: string;
  /** The single card element to wrap; it already carries the link role. */
  cardZone: ReactNode;
}) => ReactNode;
