import { Profiler } from 'react';
import { type BodyInput, RosterBody } from 'react-native-roster';
import { recordBody, recordLane } from '../profile-stats';

export function ProfiledBody(input: BodyInput) {
  return (
    <Profiler id="roster-body" onRender={recordBody}>
      <RosterBody {...input} onRowRender={recordLane} />
    </Profiler>
  );
}
