import type { Source } from './types';

/** Match source identity by kind and id, ignoring display metadata. */
export function hasSource(sources: readonly Source[], source: Source | undefined): boolean {
  return (
    source !== undefined &&
    sources.some((item) => item.kind === source.kind && item.id === source.id)
  );
}
