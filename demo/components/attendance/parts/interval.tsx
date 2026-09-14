import type { ComponentType } from 'react';
import type { IntervalInput } from 'react-native-roster';
import { ATTENDANCE_LAYER } from '../utils/layer';
import { PlanBand } from './plan-band';
import { PresenceBar } from './presence-bar';
import { TogetherBlock } from './together-block';

const INTERVALS: Record<string, ComponentType<IntervalInput>> = {
  [ATTENDANCE_LAYER.plan]: PlanBand,
  [ATTENDANCE_LAYER.presence]: PresenceBar,
  [ATTENDANCE_LAYER.together]: TogetherBlock,
};

export function AttendanceInterval(input: IntervalInput) {
  const Component = INTERVALS[input.layer.id];
  if (!Component) throw new Error(`Unknown attendance layer: ${input.layer.id}`);
  return <Component {...input} />;
}
