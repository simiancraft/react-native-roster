/** Identity is (kind, id). `label` is display metadata and never participates in equality, merging, or highlighting. */
export type Source = { kind: string; id: string; label?: string };

/** Covered time. `sources` lists the contributors that cover this exact span (for the rrule adapter: the includes). */
export type Interval = { start: number; end: number; sources: Source[] }; // epoch ms, end-exclusive

/** Removed time. `sources` lists what removed it (for the rrule adapter: the excludes). Survives complete subtraction. */
export type Gap = { start: number; end: number; sources: Source[] };

export type LayerRole = 'availability' | 'booking' | 'custom';
/** `inset` is a cross-axis distance in px (vertical in the horizontal projection, horizontal in columns), applied by the engine. */
export type LayerStyle = {
  color: string;
  highlightColor?: string;
  inset?: number;
  opacity?: number;
};
export type Layer = {
  id: string;
  role: LayerRole;
  z: number;
  style: LayerStyle;
  intervals: Interval[];
  gaps?: Gap[];
  label?: string;
};

export type LaneFlag = 'none' | 'never-set' | 'empty-in-window';
export type Lane = {
  id: string;
  /** Bumped by the consumer when layer content changes; the engine hashes layer content when absent. */
  version?: string | number;
  label: string;
  timezone?: string;
  flag?: LaneFlag;
  /** False when the lane's intervals are known to be incomplete (an adapter cap bit, #4). Default true. The hooks (#5, #11) show the incomplete label (#8) when false; the engine never infers it. */
  complete?: boolean;
  layers: Layer[];
  meta?: unknown;
};

/** A span of absolute time. No span kind, no resolution; those are axis and component concerns (#6). */
export type Window = { start: number; end: number };

/** RFC 5545 weekday numbering: 0 = Monday through 6 = Sunday. Used by `wkst`, `byweekday`, and `windowFor`. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A UTC-offset change inside a column, from `dayColumnsFor` (#6). Any size, any count. */
export type Transition = { at: number; deltaMinutes: number }; // positive = clocks moved forward (time skipped)

/** One day column in the view zone. Always projected as 24 equal wall-clock hour bands. `localDate` is the column's calendar date in the view zone ('YYYY-MM-DD'); a local date with no instants (`Pacific/Apia`, 2011-12-30) produces no column at all (#6). */
export type DayColumn = {
  start: number;
  end: number;
  localDate: string;
  label: string;
  transitions: Transition[];
};

export type Projection =
  | { orientation: 'horizontal'; viewTimezone: string; pxPerMinute: number; rowHeight: number }
  | {
      orientation: 'columns';
      viewTimezone: string;
      pxPerHour: number;
      columnWidth: number;
      days: DayColumn[];
    };

/** Final visible bounds, inset already applied; also the hit-test bounds (#8). */
export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
  layerId: string;
  z: number;
  sources: Source[];
  column?: number;
};
export type Coverage = {
  availabilityMinutes: number;
  bookingMinutes: number;
  availabilityMinusBookingMinutes: number;
};
export type LaneGeometry = {
  laneId: string;
  rects: Rect[];
  gapRects: Rect[];
  coverage: Coverage;
  flag: LaneFlag;
};
