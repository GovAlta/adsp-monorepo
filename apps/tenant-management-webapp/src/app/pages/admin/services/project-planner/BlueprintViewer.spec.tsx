import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { BlueprintViewer } from './BlueprintViewer';
import { expectNoA11yViolations } from './testing/axe';
import { createMockApi } from './testing/createMockApi';
import { Solution, SolutionBlueprint } from './model';

const blueprint: SolutionBlueprint = {
  generatedOn: '2026-03-01T10:00:00.000Z',
  mode: 'ai',
  overview: {
    title: 'Permit platform',
    summary: 'Summary text',
    objectives: ['Faster permits'],
    scope: ['Intake'],
    outOfScope: [],
    stakeholders: ['Inspectors'],
    successMeasures: ['Less wait'],
    risks: ['Adoption'],
  },
  architecture: {
    summary: 'Layered',
    layers: [{ name: 'UI', description: 'Front end', components: ['React', 'Forms'] }],
    integrations: ['Payments'],
    security: ['OIDC'],
    diagram: '[UI] -> [API]',
  },
  serviceMapping: [
    { order: 1, service: 'form-service', displayName: 'Form', role: 'Intake', reason: 'Forms', dependsOn: [], capabilities: ['Drafts'] },
    { order: 2, service: 'file-service', displayName: 'File', role: 'Docs', reason: 'Files', dependsOn: ['form-service'], capabilities: [] },
  ],
  specialistNotes: [
    {
      service: 'form-service',
      displayName: 'Form service',
      fit: 'recommended',
      source: 'saved-consultation',
      summary: 'Good fit',
      supports: ['Drafts'],
      constraints: ['None'],
      questions: ['Q1'],
      risks: ['R1'],
      validation: { verdict: 'ok', findings: ['F1'] },
      chatHighlights: ['Highlight'],
      consultedOn: '2026-03-01T09:00:00.000Z',
    },
  ],
  workflows: [{ name: 'Apply', actors: ['Applicant'], steps: ['Fill', 'Submit'] }],
  dataGovernance: { dataEntities: ['Permit'], accessControl: ['Roles'], retention: [], privacy: ['PII'], audit: ['Log'], compliance: ['FOIP'] },
  delivery: { phases: [{ name: 'Phase 1', items: ['MVP'] }], nonFunctional: ['Fast'], openQuestions: ['Budget?'] },
};

const makeSolution = (opts: { hypotheses?: boolean; blueprint?: SolutionBlueprint; analyzedOn?: string } = {}): Solution => ({
  id: 'solution-1',
  name: 'Permit intake',
  scenario: 'new',
  status: 'draft',
  createdByName: 'Pat',
  updatedOn: '2026-03-01T10:00:00.000Z',
  version: '1.0',
  versionHistory: [],
  state: {
    problemStatement: 'Permits',
    concepts: [],
    decisions: [],
    questions: [],
    hypotheses: opts.hypotheses === false ? [] : [{ id: 'h1', title: 'H', patternId: 'p', confidence: 'high', rationale: '', recommendations: [], assumptions: [], unknowns: [] }],
    specialists: [],
    nextSteps: [],
    analysis: opts.analyzedOn ? { mode: 'ai', analyzedOn: opts.analyzedOn } : undefined,
    blueprint: opts.blueprint,
  },
});

const goa = (container: HTMLElement, testId: string) => container.querySelector(`[testid="${testId}"]`);

const click = (container: HTMLElement, testId: string) =>
  fireEvent(container.querySelector(`goa-button[testid="${testId}"]`) as Element, new CustomEvent('_click'));

describe('BlueprintViewer', () => {
  it('asks to analyze first when there are no hypotheses', () => {
    const { getByTestId } = render(
      <BlueprintViewer solution={makeSolution({ hypotheses: false })} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );
    expect(getByTestId('blueprint-unavailable')).toBeTruthy();
  });

  it('generates a blueprint', async () => {
    const result = makeSolution({ blueprint });
    const api = createMockApi({ blueprint: jest.fn().mockResolvedValue(result) });
    const onSolutionChange = jest.fn();
    const { container } = render(<BlueprintViewer solution={makeSolution()} api={api} mode="rules" onSolutionChange={onSolutionChange} />);
    expect(container.querySelector('goa-button[testid="blueprint-refresh"]')).toBeNull();

    click(container, 'blueprint-generate');
    expect(container.querySelector('goa-circular-progress')).not.toBeNull();
    await waitFor(() => expect(onSolutionChange).toHaveBeenCalledWith(result));
    expect(api.blueprint).toHaveBeenCalledWith('solution-1', { mode: 'rules', refreshConsultations: false });
    expect(container.querySelector('goa-circular-progress')).toBeNull();
  });

  it('regenerates with fresh consultations', async () => {
    const solution = makeSolution({ blueprint });
    const api = createMockApi({ blueprint: jest.fn().mockResolvedValue(solution) });
    const { container } = render(<BlueprintViewer solution={solution} api={api} mode="ai" onSolutionChange={jest.fn()} />);
    expect(container.querySelector('goa-button[testid="blueprint-generate"]')?.textContent).toBe('Regenerate blueprint');
    click(container, 'blueprint-refresh');
    await waitFor(() => expect(api.blueprint).toHaveBeenCalledWith('solution-1', { mode: 'ai', refreshConsultations: true }));
  });

  it('recovers when generation fails and disables buttons while busy', async () => {
    const api = createMockApi({ blueprint: jest.fn().mockRejectedValue(new Error('x')) });
    const onSolutionChange = jest.fn();
    const { container, rerender } = render(<BlueprintViewer solution={makeSolution()} api={api} mode="ai" onSolutionChange={onSolutionChange} />);
    click(container, 'blueprint-generate');
    await waitFor(() => expect(container.querySelector('goa-circular-progress')).toBeNull());
    expect(onSolutionChange).not.toHaveBeenCalled();

    rerender(<BlueprintViewer solution={makeSolution()} api={api} mode="ai" busy onSolutionChange={onSolutionChange} />);
    expect(container.querySelector('goa-button[testid="blueprint-generate"]')?.getAttribute('disabled')).toBe('true');
  });

  it('renders all seven sections closed by default', () => {
    const { container, getByText } = render(
      <BlueprintViewer solution={makeSolution({ blueprint })} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );
    const details = container.querySelectorAll('goa-details');
    expect(details).toHaveLength(7);
    details.forEach((d) => expect(d.getAttribute('open')).not.toBe('true'));
    expect(getByText('Permit platform')).toBeTruthy();
    expect(getByText('[UI] -> [API]').getAttribute('aria-label')).toBe('Architecture diagram');
    expect(getByText('React, Forms')).toBeTruthy();
    expect(getByText('—')).toBeTruthy();
    expect(getByText('Validation: ok')).toBeTruthy();
    expect(getByText('From saved chats')).toBeTruthy();
    expect(getByText('Actors: Applicant')).toBeTruthy();
    expect(getByText('Non-functional requirements')).toBeTruthy();
  });

  it('opens all sections when allOpen', () => {
    const { container } = render(
      <BlueprintViewer solution={makeSolution({ blueprint })} api={createMockApi()} mode="ai" allOpen onSolutionChange={jest.fn()} />,
    );
    container.querySelectorAll('goa-details').forEach((d) => expect(d.getAttribute('open')).toBe('true'));
  });

  it('shows no recommended services note when there are none', () => {
    const solution = makeSolution({ blueprint: { ...blueprint, specialistNotes: [] } });
    const { getByText } = render(<BlueprintViewer solution={solution} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />);
    expect(getByText('No recommended services.')).toBeTruthy();
  });

  it('shows stale notice and warnings', () => {
    const solution = makeSolution({ blueprint: { ...blueprint, warning: 'Rules fallback' }, analyzedOn: '2026-03-02T10:00:00.000Z' });
    const { container } = render(<BlueprintViewer solution={solution} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />);
    expect(goa(container, 'blueprint-stale')).toBeTruthy();
    expect(goa(container, 'blueprint-warning').textContent).toContain('Rules fallback');
  });

  it('does not show stale notice when blueprint is current', () => {
    const solution = makeSolution({ blueprint, analyzedOn: '2026-02-28T10:00:00.000Z' });
    const { container } = render(<BlueprintViewer solution={solution} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />);
    expect(goa(container, 'blueprint-stale')).toBeNull();
    expect(goa(container, 'blueprint-warning')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <BlueprintViewer solution={makeSolution({ blueprint })} api={createMockApi()} mode="ai" allOpen onSolutionChange={jest.fn()} />,
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations before generation', async () => {
    const { container } = render(<BlueprintViewer solution={makeSolution()} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />);
    await expectNoA11yViolations(container);
  });
});
