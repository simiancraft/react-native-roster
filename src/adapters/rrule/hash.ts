import { structuralKey } from '../../core/hash';
import type { RosterDate, RosterRule } from './types';

// Use the core's collision-free canonical encoding as the content hash.
// Identity and display notes are attached fresh, never cached in occurrence lists.
export function bodyKey(input: RosterRule | RosterDate): string {
  const { id: _id, ...body } = input;
  if ('date' in body) {
    const { note: _note, ...date } = body;
    return structuralKey(date);
  }
  return structuralKey(body);
}
