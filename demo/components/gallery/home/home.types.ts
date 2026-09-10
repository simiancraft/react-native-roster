import type { ReactNode } from 'react';

/** Wraps a card in the host's link; the shell decides the router. */
export type LinkZone = (input: { href: string; children: ReactNode }) => ReactNode;
