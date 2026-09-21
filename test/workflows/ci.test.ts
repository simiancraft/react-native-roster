import { describe, expect, it } from 'bun:test';
import { resolve } from 'node:path';

type WorkflowStep = {
  if?: string;
  name?: string;
  run?: string;
};

type Workflow = {
  jobs: {
    check: { steps: WorkflowStep[] };
    release: { if: string; needs: string };
  };
};

const root = resolve(import.meta.dir, '../..');
const workflow = Bun.YAML.parse(
  await Bun.file(resolve(root, '.github/workflows/ci.yml')).text(),
) as Workflow;
const annotation = workflow.jobs.check.steps.find(
  (step) => step.name === 'Annotate blocked release',
);

describe('CI release failure annotation', () => {
  it('runs only after a failed check on a main push', () => {
    expect(annotation?.if).toBe(
      "failure() && github.event_name == 'push' && github.ref == 'refs/heads/main'",
    );
  });

  it('emits an error explaining why release cannot run', () => {
    expect(annotation?.run).toContain('::error title=Release blocked::');
    expect(annotation?.run).toContain(
      'The check job failed, preventing the dependent release job from running.',
    );
  });

  it('preserves the release dependency and opt-in condition', () => {
    expect(workflow.jobs.release.needs).toBe('check');
    expect(workflow.jobs.release.if).toBe(
      "github.event_name == 'push' && github.ref == 'refs/heads/main' && vars.RELEASE_ENABLED == 'true'",
    );
  });
});
