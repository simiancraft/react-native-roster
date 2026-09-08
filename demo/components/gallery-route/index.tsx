import { Roster } from 'react-native-roster';
import type { RosterFixtureId } from '../../../test/fixtures/roster';
import { GalleryRouteLayout } from './layout';
import { GalleryControls } from './parts/controls';
import { GalleryCounters } from './parts/counters';
import { RuleSetEditor } from './parts/rule-set-editor';
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
  const ruleSetEditorZone = model.expansion ? (
    <RuleSetEditor
      draft={model.ruleSetDraft}
      onApply={model.applyRuleSet}
      result={model.expansion}
    />
  ) : null;
  return (
    <GalleryRouteLayout
      ruleSetEditorZone={ruleSetEditorZone}
      contentDirection={model.contentDirection}
      onContentLayout={model.measureContent}
      controlsZone={<GalleryControls {...model} />}
      subjectZone={
        <Roster
          lanes={fixture.lanes}
          pxPerMinute={fixture.pxPerMinute}
          windowSpec={windowSpec}
          minuteStep={minuteStep}
          sortLanes={sortLanes}
          highlightSource={model.highlightSource}
          onIntervalHover={selectRect}
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
