import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { BlueprintViewer } from './BlueprintViewer';
import { expectNoA11yViolations } from './testing/axe';
import { createMockApi } from './testing/createMockApi';
import { BlueprintComponent, Solution, SolutionBlueprint } from './model';

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
    {
      order: 1,
      service: 'form-service',
      displayName: 'Form',
      role: 'Intake',
      reason: 'Forms',
      dependsOn: [],
      capabilities: ['Drafts'],
    },
    {
      order: 2,
      service: 'file-service',
      displayName: 'File',
      role: 'Docs',
      reason: 'Files',
      dependsOn: ['form-service'],
      capabilities: [],
    },
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
  dataGovernance: {
    dataEntities: ['Permit'],
    accessControl: ['Roles'],
    retention: [],
    privacy: ['PII'],
    audit: ['Log'],
    compliance: ['FOIP'],
  },
  delivery: { phases: [{ name: 'Phase 1', items: ['MVP'] }], nonFunctional: ['Fast'], openQuestions: ['Budget?'] },
  components: [],
};

const makeSolution = (
  opts: { hypotheses?: boolean; blueprint?: SolutionBlueprint; analyzedOn?: string } = {},
): Solution => ({
  id: 'solution-1',
  name: 'Permit intake',
  scenario: 'new',
  status: 'draft',
  createdByName: 'Pat',
  updatedOn: '2026-03-01T10:00:00.000Z',
  version: 1,
  state: {
    problemStatement: 'Permits',
    concepts: [],
    decisions: [],
    questions: [],
    hypotheses:
      opts.hypotheses === false
        ? []
        : [
            {
              id: 'h1',
              title: 'H',
              patternId: 'p',
              confidence: 'high',
              rationale: '',
              recommendations: [],
              assumptions: [],
              unknowns: [],
            },
          ],
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
      <BlueprintViewer
        solution={makeSolution({ hypotheses: false })}
        api={createMockApi()}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );
    expect(getByTestId('blueprint-unavailable')).toBeTruthy();
  });

  it('generates a blueprint', async () => {
    const result = makeSolution({ blueprint });
    const api = createMockApi({ blueprint: jest.fn().mockResolvedValue(result) });
    const onSolutionChange = jest.fn();
    const { container } = render(
      <BlueprintViewer solution={makeSolution()} api={api} mode="rules" onSolutionChange={onSolutionChange} />,
    );
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
    const { container } = render(
      <BlueprintViewer solution={solution} api={api} mode="ai" onSolutionChange={jest.fn()} />,
    );
    expect(container.querySelector('goa-button[testid="blueprint-generate"]')?.textContent).toBe(
      'Regenerate blueprint',
    );
    click(container, 'blueprint-refresh');
    await waitFor(() =>
      expect(api.blueprint).toHaveBeenCalledWith('solution-1', { mode: 'ai', refreshConsultations: true }),
    );
  });

  it('recovers when generation fails and disables buttons while busy', async () => {
    const api = createMockApi({ blueprint: jest.fn().mockRejectedValue(new Error('x')) });
    const onSolutionChange = jest.fn();
    const { container, rerender } = render(
      <BlueprintViewer solution={makeSolution()} api={api} mode="ai" onSolutionChange={onSolutionChange} />,
    );
    click(container, 'blueprint-generate');
    await waitFor(() => expect(container.querySelector('goa-circular-progress')).toBeNull());
    expect(onSolutionChange).not.toHaveBeenCalled();

    rerender(
      <BlueprintViewer solution={makeSolution()} api={api} mode="ai" busy onSolutionChange={onSolutionChange} />,
    );
    expect(container.querySelector('goa-button[testid="blueprint-generate"]')?.getAttribute('disabled')).toBe('true');
  });

  it('renders all eight sections closed by default', () => {
    const { container, getByText } = render(
      <BlueprintViewer
        solution={makeSolution({ blueprint })}
        api={createMockApi()}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );
    const sections = container.querySelectorAll('goa-accordion');
    expect(sections).toHaveLength(8);
    sections.forEach((s) => expect(s.getAttribute('open')).not.toBe('true'));
    expect(getByText('Permit platform')).toBeTruthy();
    expect(getByText('[UI] -> [API]').getAttribute('aria-label')).toBe('Architecture diagram');
    expect(getByText('React, Forms')).toBeTruthy();
    expect(getByText('—')).toBeTruthy();
    expect(getByText('Validation: ok')).toBeTruthy();
    expect(getByText('From saved chats')).toBeTruthy();
    expect(getByText('Actors: Applicant')).toBeTruthy();
    expect(getByText('Non-functional requirements')).toBeTruthy();
  });

  it('orders the sections with not covered by ADSP fourth and the components to set up fifth', () => {
    const solution = makeSolution({ blueprint: { ...blueprint, notCoveredByAdsp: [] } });
    const { container } = render(
      <BlueprintViewer solution={solution} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );
    expect([...container.querySelectorAll('goa-accordion')].map((s) => s.getAttribute('heading'))).toEqual([
      '1. Project blueprint',
      '2. Technical architecture',
      '3. ADSP service mapping',
      '4. Not covered by ADSP',
      '5. Components to set up',
      '6. Specialist consultation notes',
      '7. Core workflows',
      '8. Data & governance',
      '9. Delivery plan & other considerations',
    ]);
  });

  it('opens all sections when allOpen', () => {
    const { container } = render(
      <BlueprintViewer
        solution={makeSolution({ blueprint })}
        api={createMockApi()}
        mode="ai"
        allOpen
        onSolutionChange={jest.fn()}
      />,
    );
    container.querySelectorAll('goa-accordion').forEach((s) => expect(s.getAttribute('open')).toBe('true'));
  });

  it('does not render a not-covered section when notCoveredByAdsp is undefined', () => {
    const { container } = render(
      <BlueprintViewer
        solution={makeSolution({ blueprint })}
        api={createMockApi()}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );
    expect(goa(container, 'blueprint-section-not-covered')).toBeNull();
  });

  it('renders the not-covered items in a table', () => {
    const solution = makeSolution({
      blueprint: {
        ...blueprint,
        notCoveredByAdsp: [
          {
            requirement: 'Fee processing',
            reason: 'No service accepts payments.',
            suggestedApproach: 'Use a gateway.',
          },
        ],
      },
    });
    const { getByText } = render(
      <BlueprintViewer solution={solution} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );
    expect(getByText('Fee processing')).toBeTruthy();
    expect(getByText('No service accepts payments.')).toBeTruthy();
    expect(getByText('Use a gateway.')).toBeTruthy();
  });

  it('shows the all-covered message when notCoveredByAdsp is empty', () => {
    const solution = makeSolution({ blueprint: { ...blueprint, notCoveredByAdsp: [] } });
    const { getByText } = render(
      <BlueprintViewer solution={solution} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );
    expect(getByText('All requirements map to ADSP services.')).toBeTruthy();
  });

  it('shows no recommended services note when there are none', () => {
    const solution = makeSolution({ blueprint: { ...blueprint, specialistNotes: [] } });
    const { getByText } = render(
      <BlueprintViewer solution={solution} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );
    expect(getByText('No recommended services.')).toBeTruthy();
  });

  describe('components to set up', () => {
    const component: BlueprintComponent = {
      order: 1,
      service: 'form-service',
      type: 'Form definition',
      name: 'Permit application',
      purpose: 'Collects applications',
      dependsOn: ['Applicant role'],
      openDecisions: ['Allow drafts?'],
      target: 'adsp',
      setup: { where: 'Tenant admin > Form', docs: 'https://docs/form', how: 'Create the definition' },
    };

    const renderWith = (components?: BlueprintComponent[], api = createMockApi(), onSolutionChange = jest.fn()) =>
      render(
        <BlueprintViewer solution={makeSolution({ blueprint: { ...blueprint, components } })} api={api} mode="ai" onSolutionChange={onSolutionChange} />,
      );

    const second: BlueprintComponent = { ...component, order: 2, name: 'Applicant role', target: 'keycloak' };

    it('lists each component with where and how to set it up', () => {
      const { container, getByText } = renderWith([component]);
      expect(goa(container, 'blueprint-components')).toBeTruthy();
      expect(getByText('Permit application')).toBeTruthy();
      expect(getByText('Form definition')).toBeTruthy();
      expect(getByText('Collects applications')).toBeTruthy();
      expect(getByText('Tenant admin > Form')).toBeTruthy();
      expect(getByText('Create the definition')).toBeTruthy();
      expect(getByText('Depends on: Applicant role')).toBeTruthy();
      expect(getByText('Allow drafts?')).toBeTruthy();
    });

    it('links each component to its docs in a new tab', () => {
      const { getByRole } = renderWith([component]);
      const link = getByRole('link', { name: 'Docs' });
      expect(link.getAttribute('href')).toBe('https://docs/form');
      expect(link.getAttribute('target')).toBe('_blank');
    });

    it('shows what a component depends on with its where and how so the table keeps its status column in view', () => {
      const { container, getByText } = renderWith([component]);
      const headers = [...goa(container, 'blueprint-components').querySelectorAll('th')].map((th) => th.textContent);
      expect(headers).not.toContain('Depends on');
      expect(getByText('Depends on: Applicant role').closest('td').textContent).toContain('Tenant admin > Form');
    });

    it('leaves out the depends-on line for a component with no dependencies', () => {
      const { container } = renderWith([{ ...component, dependsOn: [] }]);
      expect(goa(container, 'blueprint-components').textContent).not.toContain('Depends on');
    });

    it('shows an empty list for a blueprint saved before components existed', () => {
      const { container } = renderWith(undefined);
      expect(goa(container, 'blueprint-components').querySelectorAll('tbody tr')).toHaveLength(0);
    });

    it('shows each component as not reviewed until the user reviews it', () => {
      const { container } = renderWith([component, { ...second, review: 'rejected' }]);
      expect(goa(container, 'component-review-1').getAttribute('value')).toBe('not-reviewed');
      expect(goa(container, 'component-review-2').getAttribute('value')).toBe('rejected');
    });

    it('saves the review the user picks', async () => {
      const result = makeSolution({ blueprint: { ...blueprint, components: [{ ...component, review: 'approved' }] } });
      const api = createMockApi({ reviewComponent: jest.fn().mockResolvedValue(result) });
      const onSolutionChange = jest.fn();
      const { container } = renderWith([component], api, onSolutionChange);

      fireEvent(goa(container, 'component-review-1'), new CustomEvent('_change', { detail: { value: 'approved' } }));

      await waitFor(() => expect(onSolutionChange).toHaveBeenCalledWith(result));
      expect(api.reviewComponent).toHaveBeenCalledWith('solution-1', 1, 'approved');
    });

    it('counts the components still to be reviewed', () => {
      const { container } = renderWith([component, second, { ...second, order: 3, name: 'Staff role', review: 'approved' }]);
      expect(goa(container, 'blueprint-components-to-review').getAttribute('content')).toBe('2 components to review');
    });

    it('uses the singular when one component is left to review', () => {
      const { container } = renderWith([component, { ...second, review: 'rejected' }]);
      expect(goa(container, 'blueprint-components-to-review').getAttribute('content')).toBe('1 component to review');
    });

    it('drops the review badge once every component is reviewed', () => {
      const { container } = renderWith([
        { ...component, review: 'approved' },
        { ...second, review: 'rejected' },
      ]);
      expect(goa(container, 'blueprint-components-to-review')).toBeNull();
    });

    it('has no accessibility violations', async () => {
      const solution = makeSolution({ blueprint: { ...blueprint, components: [component] } });
      const { container } = render(<BlueprintViewer solution={solution} api={createMockApi()} mode="ai" allOpen onSolutionChange={jest.fn()} />);
      await expectNoA11yViolations(container);
    });
  });

  it('shows stale notice and warnings', () => {
    const solution = makeSolution({
      blueprint: { ...blueprint, warning: 'Rules fallback' },
      analyzedOn: '2026-03-02T10:00:00.000Z',
    });
    const { container } = render(
      <BlueprintViewer solution={solution} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );
    expect(goa(container, 'blueprint-stale')).toBeTruthy();
    expect(goa(container, 'blueprint-warning').textContent).toContain('Rules fallback');
  });

  it('does not show stale notice when blueprint is current', () => {
    const solution = makeSolution({ blueprint, analyzedOn: '2026-02-28T10:00:00.000Z' });
    const { container } = render(
      <BlueprintViewer solution={solution} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );
    expect(goa(container, 'blueprint-stale')).toBeNull();
    expect(goa(container, 'blueprint-warning')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <BlueprintViewer
        solution={makeSolution({ blueprint })}
        api={createMockApi()}
        mode="ai"
        allOpen
        onSolutionChange={jest.fn()}
      />,
    );
    await expectNoA11yViolations(container);
  });

  it('has no accessibility violations before generation', async () => {
    const { container } = render(
      <BlueprintViewer solution={makeSolution()} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );
    await expectNoA11yViolations(container);
  });
});
