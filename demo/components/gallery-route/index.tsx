import { Roster } from 'react-native-roster';
import type { RosterFixtureId } from '../../../test/fixtures/roster';
import { GalleryRouteLayout } from './layout';
import { GalleryControls } from './parts/controls';
import { GalleryCounters } from './parts/counters';
import { useGalleryRoute } from './use-gallery-route';

export function GalleryRoute({ fixtureId }: { fixtureId: RosterFixtureId }) {
  const model = useGalleryRoute(fixtureId);
  const {
    fixture,
    windowSpec,
    minuteStep,
    sortLanes,
    setWindowSpec,
    selectRect,
    selectCell,
    snapshot,
    selection,
  } = model;
  const { zones, showsEmptyExample } = fixture;
  const emptyExample = showsEmptyExample ? (
    <Roster lanes={[]} windowSpec={windowSpec} {...zones} />
  ) : null;
  return (
    <GalleryRouteLayout
      controlsZone={<GalleryControls {...model} />}
      subjectZone={
        <Roster
          lanes={fixture.lanes}
          windowSpec={windowSpec}
          minuteStep={minuteStep}
          sortLanes={sortLanes}
          onNavigate={setWindowSpec}
          onIntervalPress={selectRect}
          onGapPress={selectRect}
          onCellPress={selectCell}
          {...zones}
        />
      }
      countersZone={
        <>
          {emptyExample}
          <GalleryCounters snapshot={snapshot} selection={selection} />
        </>
      }
    />
  );
}
