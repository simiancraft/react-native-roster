import { Roster } from 'react-native-roster';
import type { RosterFixtureId } from '../../../../../test/fixtures/roster';
import { FixtureLayout } from '../layout';
import { GalleryCounters } from '../parts/counters';
import { GalleryControls } from './parts/controls';
import { ProfiledBody } from './parts/profiled-body';
import { RuleSetEditor } from './parts/rule-set-editor';
import { useRosterFixture } from './use-roster-fixture';

export function RosterFixtureScreen({ fixtureId }: { fixtureId: RosterFixtureId }) {
  const model = useRosterFixture(fixtureId);
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
  const bodyZone = __DEV__ && fixtureId === '200-lanes' ? ProfiledBody : zones?.bodyZone;
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
    <FixtureLayout
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
          bodyZone={bodyZone}
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
