import { Roster } from 'react-native-roster';
import type { RosterFixtureId } from '../../../../../test/fixtures/roster';
import { FixtureLayout } from '../layout';
import { Control } from '../parts/control';
import { GalleryCounters } from '../parts/counters';
import { GalleryControls } from './parts/controls';
import { HighlightControls } from './parts/highlight-controls';
import { PerformanceControls } from './parts/performance-controls';
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
  const bodyComponent =
    __DEV__ && (fixture.workload || fixture.inspectorLayout) ? ProfiledBody : zones?.bodyComponent;
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
  const highlightZone = fixture.highlightSource ? (
    <HighlightControls
      active={!!model.highlightSource}
      onHighlight={model.highlightRule}
      onClear={model.clearHighlight}
    />
  ) : null;
  const nowZone = fixture.showsNowToggle ? (
    <Control label="Now at window midpoint" selected={model.showNow} onPress={model.toggleNow} />
  ) : null;
  const performanceZone = fixture.workload ? (
    <PerformanceControls
      onMeasureColdLayout={model.measureColdLayout}
      onChangeRule={model.changeRule}
      onChangeLaneTimezone={model.changeLaneTimezone}
    />
  ) : null;
  return (
    <FixtureLayout
      ruleSetEditorZone={ruleSetEditorZone}
      direction={model.contentDirection}
      onContentLayout={model.measureContent}
      controlsZone={
        <>
          {fixture.inspectorLayout ? (
            <Control
              label={model.presentation === 'popover' ? 'Show inspector' : 'Show popover'}
              onPress={() =>
                model.setPresentation(model.presentation === 'popover' ? 'inspector' : 'popover')
              }
            />
          ) : null}
          <GalleryControls
            {...model}
            nowZone={nowZone}
            highlightZone={highlightZone}
            performanceZone={performanceZone}
          />
        </>
      }
      subjectZone={
        <Roster
          now={model.now}
          selectionLayout={
            fixture.inspectorLayout && model.presentation === 'inspector'
              ? fixture.inspectorLayout
              : undefined
          }
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
          bodyComponent={bodyComponent}
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
