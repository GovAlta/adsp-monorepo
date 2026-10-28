import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { SolutionWorkplace, getGuidedStep } from './SolutionWorkplace';
import { usePlannerApi } from './api';
import { expectNoA11yViolations } from './testing/axe';
import { createMockApi, MockPlannerApi } from './testing/createMockApi';
import { download } from './utils';
import { Solution, SolutionBlueprint, SolutionVersionList, SpecialistDefinition } from './model';

jest.mock('./api', () => ({ usePlannerApi: jest.fn() }));
jest.mock('./utils', () => ({ ...jest.requireActual('./utils'), download: jest.fn() }));

const goa = (container: HTMLElement, testId: string) =>
  container.querySelector(`[testid="${testId}"], [data-testid="${testId}"]`) as Element;
const click = (container: HTMLElement, testId: string) => fireEvent(goa(container, testId), new CustomEvent('_click'));
const type = (container: HTMLElement, testId: string, value: string) =>
  fireEvent(goa(container, testId), new CustomEvent('_change', { detail: { name: 'x', value } }));

const blueprint: SolutionBlueprint = {
  generatedOn: '2026-03-01T10:00:00.000Z',
  mode: 'ai',
  overview: {
    title: 'Permit intake plan',
    summary: 'Applicants submit permit applications for staff review.',
    objectives: [],
    scope: [],
    outOfScope: [],
    stakeholders: [],
    successMeasures: [],
    risks: [],
  },
  architecture: { summary: '', layers: [], integrations: [], security: [], diagram: '' },
  serviceMapping: [
    {
      order: 1,
      service: 'form-service',
      displayName: 'Form service',
      role: 'Collect applications',
      reason: 'Applicants need a form.',
      dependsOn: [],
      capabilities: [],
    },
  ],
  notCoveredByAdsp: [],
  specialistNotes: [],
  workflows: [],
  dataGovernance: { dataEntities: [], accessControl: [], retention: [], privacy: [], audit: [], compliance: [] },
  delivery: { phases: [], nonFunctional: [], openQuestions: [] },
};

const baseSolution = (state: Partial<Solution['state']> = {}): Solution => ({
  id: 'solution-1',
  name: 'Permit intake',
  scenario: 'new',
  status: 'draft',
  createdByName: 'Pat',
  updatedOn: '2026-03-01T10:00:00.000Z',
  version: 1,
  state: {
    problemStatement: 'Applicants submit permits for staff review.',
    concepts: [],
    decisions: [],
    questions: [],
    hypotheses: [],
    specialists: [],
    nextSteps: [],
    ...state,
  },
});

const analyzed = (extra: Partial<Solution['state']> = {}): Solution =>
  baseSolution({
    analysis: { mode: 'ai', analyzedOn: '2026-03-01T10:00:00.000Z' },
    confidence: { score: 70, threshold: 50, factors: [{ id: 'users', label: 'Users', score: 70 }] },
    hypotheses: [
      {
        id: 'h1',
        title: 'Permit solution',
        patternId: 'p1',
        confidence: 'high',
        rationale: 'Permit workflow.',
        recommendations: [{ service: 'form-service', reason: 'Collect applications.', order: 1 }],
        assumptions: [],
        unknowns: [],
      },
    ],
    questions: [
      { id: 'q1', question: 'Who reviews applications?', raisedBy: 'planner', status: 'inferred', answer: 'Staff' },
    ],
    ...extra,
  });

const withPlan = (extra: Partial<Solution['state']> = {}): Solution =>
  baseSolution({ ...analyzed(extra).state, blueprint, ...extra });

const specialists = [
  {
    service: 'form-service',
    displayName: 'Form service',
    purpose: 'Forms',
    order: 1,
    questions: [],
    dependsOn: [],
    risks: [],
    workspacePath: '',
  },
] as SpecialistDefinition[];

const versionList = (latest = 1, unsavedChanges = false): SolutionVersionList => ({
  latest,
  unsavedChanges,
  results: Array.from({ length: latest }, (_, index) => ({
    number: latest - index,
    name: `Version ${latest - index}`,
    createdOn: '2026-03-01T10:00:00.000Z',
  })),
});

describe('SolutionWorkplace', () => {
  let api: MockPlannerApi;
  const onBack = jest.fn();
  const setup = async (solution: Solution = withPlan(), overrides = {}) => {
    api = createMockApi({
      getSolution: jest.fn().mockResolvedValue(solution),
      listSpecialists: jest.fn().mockResolvedValue(specialists),
      listChats: jest.fn().mockResolvedValue([]),
      getAnalysisOptions: jest.fn().mockResolvedValue({ modes: ['ai', 'rules'], defaultMode: 'ai' }),
      listVersions: jest.fn().mockResolvedValue(versionList()),
      ...overrides,
    });
    (usePlannerApi as jest.Mock).mockReturnValue(api);
    const view = render(<SolutionWorkplace solutionId="solution-1" onBack={onBack} />);
    await waitFor(() => expect(view.container.querySelector('[data-testid="solution-workplace"]')).not.toBeNull());
    await waitFor(() => expect(api.listSpecialists).toHaveBeenCalled());
    return view;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens new, in-progress, and planned solutions at the correct step', () => {
    expect(getGuidedStep(baseSolution())).toBe(1);
    expect(getGuidedStep(analyzed({ confidence: { score: 20, threshold: 50, factors: [] } }))).toBe(2);
    expect(getGuidedStep(analyzed())).toBe(3);
    expect(getGuidedStep(withPlan())).toBe(3);
  });

  it('shows an existing solution as one continuous guided page', async () => {
    const planned = withPlan();
    planned.state.blueprint = {
      ...blueprint,
      notCoveredByAdsp: [
        { requirement: 'Payment processing', reason: 'Not provided by ADSP.', suggestedApproach: 'Use a gateway.' },
      ],
    };
    const { container } = await setup(planned);
    expect(container.querySelector('nav[aria-label="Solution sections"]')).toBeNull();
    expect(container.querySelector('#guided-stepper')).toBeNull();
    expect(container.textContent).toContain(
      'Refine the analysis by answering optional questions, asking a question, adding more details, or correcting gaps.',
    );
    expect(container.querySelector('[testid="problem-continue"]')?.textContent).toContain('Save & analyze');
    expect(container.textContent).not.toContain('At a glance');
    expect(container.querySelector('[testid="plan-summary"]')).toBeNull();
    expect(container.querySelector('[testid="blueprint-not-covered"]')).not.toBeNull();
    expect(container.querySelector('[testid="project-blueprint"]')).not.toBeNull();
    expect(container.querySelector('[testid="project-blueprint"]')?.tagName.toLowerCase()).toBe('goa-container');
    expect(goa(container, 'project-blueprint-generate').textContent).toContain('Regenerate blueprint');
    expect(container.querySelector('[heading="Proposal"]')).not.toBeNull();
    expect(container.querySelector('[heading="Hypotheses"]')).toBeNull();
    expect(container.querySelector('[data-testid="refine-chat"]')).toBeNull();
    expect(container.textContent).toContain(
      'Refine the analysis by answering optional questions, asking a question, adding more details, or correcting gaps.',
    );
    expect(container.querySelector('[testid="optional-experts"]')).not.toBeNull();
    expect(container.querySelector('[testid="specialist-service-form-service"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="selected-specialist-chat"]')).not.toBeNull();
    expect(container.textContent).not.toContain('Answers the planner understood');
    expect(container.querySelector('[testid="analysis-mode-ai"]')).not.toBeNull();
    expect(container.querySelector('[testid="analysis-mode-rules"]')).not.toBeNull();
    expect(goa(container, 'analysis-mode-badge').getAttribute('content')).toContain(
      new Date(planned.state.analysis!.analyzedOn).toLocaleString(),
    );
    expect(
      goa(container, 'analysis-mode-badge').compareDocumentPosition(goa(container, 'problem-continue')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    for (const [step, heading] of [
      ['guided-step-1', 'Problem statement'],
      ['guided-step-2', 'Discovery conversation'],
      ['guided-step-3', 'Proposed solution'],
    ]) {
      const toggle = goa(container, `${step}-toggle`);
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(toggle.textContent).toContain(heading);
      expect(toggle.closest('h2')).not.toBeNull();
      expect((toggle.closest('h2') as HTMLElement).style.fontWeight).toBe('600');
      expect(container.querySelector(`#${step}-content`)).not.toBeNull();
    }
    expect(goa(container, 'guided-step-2').querySelectorAll('goa-textarea[testid="discovery-input"]')).toHaveLength(1);
    expect(goa(container, 'guided-step-2').querySelector('[testid="refine-input"]')).toBeNull();
    expect(goa(container, 'guided-step-2').querySelector('[testid="optional-experts"]')).not.toBeNull();
    expect(goa(container, 'project-blueprint-generate').closest('[role="group]')).toBe(
      goa(container, 'refresh-specialist-consultations').closest('[role="group]'),
    );
    expect(container.querySelector('[testid="advanced-plan-options"]')).toBeNull();
    expect(goa(container, 'download-json')).not.toBeNull();
    expect(container.textContent).not.toContain('Refine by conversation');
    expect(goa(container, 'optional-experts').getAttribute('heading')).toContain('Chat/Consult with Specialist');
    expect(container.textContent).not.toContain('5. Consult a specialist');

    fireEvent.click(goa(container, 'guided-step-2-toggle'));
    expect(goa(container, 'guided-step-2-toggle').getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('#guided-step-2-content')).toBeNull();
    fireEvent.click(goa(container, 'guided-step-2-toggle'));
    expect(goa(container, 'guided-step-2-toggle').getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('#guided-step-2-content')).not.toBeNull();
  });

  it('keeps the blueprint action available after automatic generation', async () => {
    const ready = analyzed();
    const { container } = await setup(ready, { blueprint: jest.fn().mockResolvedValue(withPlan()) });

    expect(goa(container, 'project-blueprint-generate').textContent).toContain('Regenerate blueprint');
    expect(container.querySelector('[testid="blueprint-generate"]')).toBeNull();
  });

  it('regenerates the blueprint with fresh specialist consultations from the adjacent action', async () => {
    const planned = withPlan();
    const { container } = await setup(planned, { blueprint: jest.fn().mockResolvedValue(planned) });

    click(container, 'refresh-specialist-consultations');

    await waitFor(() =>
      expect(api.blueprint).toHaveBeenCalledWith('solution-1', { mode: 'ai', refreshConsultations: true }),
    );
  });

  it('lists all specialists in the optional section, not only recommendations', async () => {
    const otherSpecialist = {
      service: 'status-service',
      displayName: 'Status service',
      purpose: 'Track status updates',
      order: 2,
      questions: [],
      dependsOn: [],
      risks: [],
      workspacePath: '',
    } as SpecialistDefinition;
    const { container } = await setup(withPlan(), {
      listSpecialists: jest.fn().mockResolvedValue([...specialists, otherSpecialist]),
    });

    expect(container.querySelector('[testid="specialist-service-form-service"]')).not.toBeNull();
    expect(container.querySelector('[testid="specialist-service-status-service"]')).not.toBeNull();
    expect(container.querySelector('[testid="optional-experts"]')?.hasAttribute('open')).toBe(false);
  });

  it('refreshes the saved solution plan with Save & analyze', async () => {
    const planned = withPlan();
    const { container } = await setup(planned, {
      analyze: jest.fn().mockResolvedValue(planned),
      blueprint: jest.fn().mockResolvedValue(planned),
    });

    click(container, 'problem-continue');

    await waitFor(() => expect(api.analyze).toHaveBeenCalledWith('solution-1', { mode: 'ai' }));
    await waitFor(() => expect(api.blueprint).toHaveBeenCalledWith('solution-1', { mode: 'ai' }));
  });

  it('shows one Save & analyze action for a new solution and keeps discovery in place', async () => {
    const newSolution = baseSolution({ problemStatement: '' });
    const analyzedSolution = analyzed({
      confidence: { score: 40, threshold: 50, factors: [] },
    });
    const discovered = {
      ...analyzedSolution,
      state: {
        ...analyzedSolution.state,
        discovery: {
          messages: [{ role: 'assistant' as const, content: 'Who reviews applications?', at: '2026-03-01T10:01:00Z' }],
          confidence: 40,
          threshold: 50,
          factors: [],
          ready: false,
          mode: 'ai' as const,
          updatedOn: '2026-03-01T10:01:00Z',
        },
      },
    };
    const { container } = await setup(newSolution, {
      updateSolution: jest.fn().mockResolvedValue(newSolution),
      analyze: jest.fn().mockResolvedValue(analyzedSolution),
      discovery: jest.fn().mockResolvedValue(discovered),
    });

    expect(goa(container, 'guided-step-1-toggle').textContent).toContain('Problem statement');
    expect(goa(container, 'guided-step-2-toggle').textContent).toContain('Discovery conversation');
    expect(goa(container, 'problem-continue').textContent).toContain('Save & analyze');
    expect(container.querySelectorAll('[testid="problem-continue"]')).toHaveLength(1);
    expect(container.textContent).toContain('Save and analyze the problem to start discovery');
    expect(container.querySelector('[testid="step-disabled-3"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="discovery-panel"]')).toBeNull();
    expect(container.querySelector('[testid="analysis-mode-ai"]')).not.toBeNull();
    type(container, 'problem-input', 'New permit workflow.');
    click(container, 'problem-continue');
    await waitFor(() => expect(api.discovery).toHaveBeenCalledWith('solution-1', { mode: 'ai', restart: true }));
    expect(container.querySelector('[data-testid="discovery-panel"]')).not.toBeNull();
    expect(container.textContent).toContain('Who reviews applications?');
  });

  it('uses the selected analysis mode and generates the blueprint once when confidence meets the threshold', async () => {
    const rulesAnalysis = { mode: 'rules' as const, analyzedOn: '2026-03-01T10:00:00.000Z' };
    const analyzedSolution = analyzed({ analysis: rulesAnalysis });
    const planned = withPlan({ analysis: rulesAnalysis, blueprint: { ...blueprint, mode: 'rules' } });
    const { container } = await setup(baseSolution(), {
      updateSolution: jest.fn().mockResolvedValue(baseSolution()),
      analyze: jest.fn().mockResolvedValue(analyzedSolution),
      blueprint: jest.fn().mockResolvedValue(planned),
    });
    type(container, 'problem-input', 'Detailed permit workflow.');
    click(container, 'problem-continue');

    await waitFor(() => expect(api.blueprint).toHaveBeenCalledTimes(1));
    expect(api.analyze).toHaveBeenCalledWith('solution-1', { mode: 'ai' });
    expect(api.blueprint).toHaveBeenCalledWith('solution-1', { mode: 'rules' });
    expect(api.discovery).not.toHaveBeenCalled();
    expect(goa(container, 'analysis-mode-rules').getAttribute('type')).toBe('primary');
    expect(goa(container, 'analysis-mode-badge').getAttribute('content')).toContain('Last run: Rule-based analysis');
    expect(container.querySelector('[data-testid="discovery-panel"]')).not.toBeNull();
    expect(container.textContent).toContain(
      'Refine the analysis by answering optional questions, asking a question, adding more details, or correcting gaps.',
    );
    expect(container.querySelectorAll('goa-textarea[testid="discovery-input"]')).toHaveLength(1);
    expect(container.querySelector('[data-testid="confidence-bar"]')).not.toBeNull();
    expect(
      container
        .querySelector('[data-testid="confidence-bar"]')
        ?.compareDocumentPosition(goa(container, 'guided-step-1')) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('automatically asks one batch of questions when confidence is below the threshold', async () => {
    const lowConfidence = analyzed({
      confidence: { score: 40, threshold: 50, factors: [{ id: 'users', label: 'Users', score: 40 }] },
    });
    const discovered = {
      ...lowConfidence,
      state: {
        ...lowConfidence.state,
        discovery: {
          messages: [{ role: 'assistant' as const, content: 'Who uses the service?', at: '2026-03-01T10:01:00Z' }],
          confidence: 40,
          threshold: 50,
          factors: [],
          ready: false,
          mode: 'ai' as const,
          updatedOn: '2026-03-01T10:01:00Z',
        },
      },
    };
    const { container } = await setup(baseSolution(), {
      updateSolution: jest.fn().mockResolvedValue(baseSolution()),
      analyze: jest.fn().mockResolvedValue(lowConfidence),
      discovery: jest.fn().mockResolvedValue(discovered),
    });
    click(container, 'problem-continue');

    await waitFor(() => expect(api.discovery).toHaveBeenCalledWith('solution-1', { mode: 'ai', restart: true }));
    expect(container.textContent).toContain('Who uses the service?');
  });

  it('shows remaining questions as optional and allows skipping to a plan', async () => {
    const lowConfidence = analyzed({
      confidence: { score: 40, threshold: 50, factors: [] },
      questions: [{ id: 'q1', question: 'Who reviews applications?', raisedBy: 'planner', status: 'open' }],
      discovery: {
        messages: [],
        confidence: 40,
        threshold: 50,
        factors: [],
        ready: false,
        mode: 'ai',
        updatedOn: '2026-03-01T10:00:00Z',
      },
    });
    const { container } = await setup(lowConfidence);
    expect(goa(container, 'discovery-force').textContent).toBe('Skip and show me a plan');
    expect(goa(container, 'discovery-questions').getAttribute('heading')).toBe('Questions');
    expect(container.querySelectorAll('goa-textarea[testid="discovery-input"]')).toHaveLength(1);
    expect(container.querySelector('[data-testid="discovery-panel"]')).not.toBeNull();
    expect(container.textContent).not.toContain('Questions are complete');
  });

  it('generates a blueprint when the user skips low-confidence discovery', async () => {
    const lowConfidence = analyzed({
      confidence: { score: 40, threshold: 50, factors: [] },
      discovery: {
        messages: [{ role: 'assistant', content: 'Who uses the service?', at: '2026-03-01T10:01:00Z' }],
        confidence: 40,
        threshold: 50,
        factors: [],
        ready: false,
        mode: 'ai',
        updatedOn: '2026-03-01T10:01:00Z',
      },
    });
    const forced = {
      ...lowConfidence,
      state: {
        ...lowConfidence.state,
        discovery: { ...lowConfidence.state.discovery!, ready: true, updatedOn: '2026-03-01T10:02:00Z' },
      },
    };
    const planned = withPlan();
    const { container } = await setup(lowConfidence, {
      discovery: jest.fn().mockResolvedValue(forced),
      blueprint: jest.fn().mockResolvedValue(planned),
    });

    click(container, 'discovery-force');

    await waitFor(() => expect(api.discovery).toHaveBeenCalledWith('solution-1', { mode: 'ai', force: true }));
    await waitFor(() => expect(api.blueprint).toHaveBeenCalledWith('solution-1', { mode: 'ai' }));
    expect(container.querySelector('[testid="plan-ready"]')).not.toBeNull();
  });

  it('keeps the plan visible, marks it out of date, and directs users to Save & analyze', async () => {
    const { container } = await setup();
    type(container, 'problem-input', 'Changed permit workflow.');

    expect(container.querySelector('[testid="problem-plan-out-of-date"]')).not.toBeNull();
    expect(goa(container, 'problem-back-to-questions')).not.toBeNull();
    expect(container.querySelector('[testid="update-plan"]')).toBeNull();
    expect(container.querySelector('[testid="plan-out-of-date"]')?.textContent).toContain('Save & analyze above');
  });

  it('refreshes an existing blueprint when Save & analyze is used', async () => {
    const analyzedSolution = analyzed();
    const refreshedPlan = withPlan();
    const { container } = await setup(withPlan(), {
      updateSolution: jest.fn().mockResolvedValue(baseSolution({ problemStatement: 'Updated permit process.' })),
      analyze: jest.fn().mockResolvedValue(analyzedSolution),
      blueprint: jest.fn().mockResolvedValue(refreshedPlan),
    });
    type(container, 'problem-input', 'Updated permit process.');
    click(container, 'problem-continue');

    await waitFor(() => expect(api.blueprint).toHaveBeenCalledWith('solution-1', { mode: 'ai' }));
    expect(api.analyze).toHaveBeenCalledWith('solution-1', { mode: 'ai' });
  });

  it('downloads JSON and the markdown report', async () => {
    const { container } = await setup(undefined, {
      exportSolution: jest.fn().mockResolvedValue({ id: 'solution-1' }),
    });

    click(container, 'download-json');
    await waitFor(() =>
      expect(download).toHaveBeenCalledWith(
        'planner-permit-intake.json',
        JSON.stringify({ id: 'solution-1' }, null, 2),
        'application/json',
      ),
    );

    click(container, 'download-report');
    await waitFor(() =>
      expect(download).toHaveBeenCalledWith(
        'planner-permit-intake.md',
        expect.stringContaining('# Permit intake'),
        'text/markdown',
      ),
    );
  });

  it('downloads the harness instructions for the exported version', async () => {
    const { container } = await setup(undefined, { exportSolution: jest.fn().mockResolvedValue({ version: 2 }) });

    click(container, 'download-harness');

    await waitFor(() =>
      expect(download).toHaveBeenCalledWith(
        'planner-permit-intake-harness.md',
        expect.stringContaining('solution-version: 2'),
        'text/markdown',
      ),
    );
  });

  it('disables the harness download while an export is running', async () => {
    const { container } = await setup(undefined, { exportSolution: jest.fn(() => new Promise(() => undefined)) });

    click(container, 'download-harness');

    await waitFor(() => expect(goa(container, 'download-harness').getAttribute('disabled')).toBe('true'));
  });

  it('shows the latest saved version and blocks saving when nothing has changed', async () => {
    const { container } = await setup(undefined, { listVersions: jest.fn().mockResolvedValue(versionList(3)) });

    await waitFor(() => expect(goa(container, 'solution-version').getAttribute('content')).toBe('v3'));
    expect(goa(container, 'unsaved-changes')).toBeNull();
    expect(goa(container, 'save-version').getAttribute('disabled')).toBe('true');
  });

  it('saves a version when there are unsaved changes', async () => {
    const { container } = await setup(undefined, {
      listVersions: jest.fn().mockResolvedValueOnce(versionList(1, true)).mockResolvedValue(versionList(2)),
      saveVersion: jest.fn().mockResolvedValue({ number: 2, name: 'Version 2', createdOn: '2026-03-02T10:00:00.000Z' }),
    });
    await waitFor(() => expect(goa(container, 'unsaved-changes')).not.toBeNull());
    expect(goa(container, 'save-version').getAttribute('disabled')).toBeNull();

    click(container, 'save-version');

    await waitFor(() => expect(goa(container, 'solution-version').getAttribute('content')).toBe('v2'));
    expect(api.saveVersion).toHaveBeenCalledWith('solution-1');
    expect(goa(container, 'unsaved-changes')).toBeNull();
  });

  it('refreshes the version status when saving fails', async () => {
    const { container } = await setup(undefined, {
      listVersions: jest.fn().mockResolvedValueOnce(versionList(1, true)).mockResolvedValue(versionList(2)),
      saveVersion: jest.fn().mockRejectedValue(new Error('conflict')),
    });
    await waitFor(() => expect(goa(container, 'unsaved-changes')).not.toBeNull());

    click(container, 'save-version');

    await waitFor(() => expect(goa(container, 'solution-version').getAttribute('content')).toBe('v2'));
  });

  it('opens the saved versions', async () => {
    const { container } = await setup(undefined, { listVersions: jest.fn().mockResolvedValue(versionList(2)) });
    await waitFor(() => expect(goa(container, 'solution-version').getAttribute('content')).toBe('v2'));

    click(container, 'open-versions');

    expect(goa(container, 'versions-modal').getAttribute('open')).toBe('true');
    expect(container.textContent).toContain('Version 2');
  });

  it('refreshes the version status after a specialist chat changes', async () => {
    const { container } = await setup(undefined, {
      consult: jest.fn().mockResolvedValue({
        service: 'form-service',
        fit: 'recommended',
        reason: 'Good for intake',
        questions: [],
        dependencies: [],
        risks: [],
      }),
    });
    await waitFor(() => expect(api.listVersions).toHaveBeenCalledTimes(1));

    click(container, 'chat-consult');

    await waitFor(() => expect(api.listVersions).toHaveBeenCalledTimes(2));
  });

  it('confirms before deleting then goes back', async () => {
    const { container } = await setup(undefined, { deleteSolution: jest.fn().mockResolvedValue(undefined) });

    click(container, 'delete-solution');
    expect(goa(container, 'delete-solution-modal').getAttribute('open')).toBe('true');
    click(container, 'delete-cancel');
    expect(goa(container, 'delete-solution-modal').getAttribute('open')).not.toBe('true');
    expect(api.deleteSolution).not.toHaveBeenCalled();

    click(container, 'delete-solution');
    click(container, 'delete-confirm');

    await waitFor(() => expect(api.deleteSolution).toHaveBeenCalledWith('solution-1'));
    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });

  it('stays on the page when deleting fails', async () => {
    const { container } = await setup(undefined, { deleteSolution: jest.fn().mockRejectedValue(new Error('x')) });

    click(container, 'delete-solution');
    click(container, 'delete-confirm');

    await waitFor(() => expect(api.deleteSolution).toHaveBeenCalled());
    expect(onBack).not.toHaveBeenCalled();
  });
  it('exports Markdown and JSON through the existing export API', async () => {
    const { container } = await setup(undefined, { exportSolution: jest.fn().mockResolvedValue(withPlan()) });
    click(container, 'download-report');
    await waitFor(() => expect(api.exportSolution).toHaveBeenCalledTimes(1));
    click(container, 'download-json');
    await waitFor(() => expect(api.exportSolution).toHaveBeenCalledTimes(2));
    expect(download).toHaveBeenCalledTimes(2);
  });

  it('automatically generates a missing blueprint once for an existing ready solution', async () => {
    await setup(analyzed(), { blueprint: jest.fn().mockResolvedValue(withPlan()) });
    await waitFor(() => expect(api.blueprint).toHaveBeenCalledTimes(1));
  });

  it('shows a busy overlay and blocks the header and problem statement while discovery is working', async () => {
    const planned = withPlan();
    let resolveChat: (value: Solution) => void = () => undefined;
    const chatPromise = new Promise<Solution>((resolve) => {
      resolveChat = resolve;
    });
    const { container } = await setup(planned, { chat: jest.fn().mockReturnValue(chatPromise) });

    expect(container.querySelector('[data-testid="workplace-busy-overlay"]')).toBeNull();
    expect(goa(container, 'download-json').getAttribute('disabled')).toBeNull();

    type(container, 'discovery-input', 'Add more detail about the renewal process.');
    click(container, 'discovery-send');

    await waitFor(() => expect(container.querySelector('[data-testid="workplace-busy-overlay"]')).not.toBeNull());
    expect(goa(container, 'download-json').getAttribute('disabled')).toBe('true');
    expect(goa(container, 'download-harness').getAttribute('disabled')).toBe('true');
    expect(goa(container, 'delete-solution').getAttribute('disabled')).toBe('true');
    expect(goa(container, 'problem-continue').getAttribute('disabled')).toBe('true');

    resolveChat(planned);
    await waitFor(() => expect(container.querySelector('[data-testid="workplace-busy-overlay"]')).toBeNull());
    expect(goa(container, 'download-json').getAttribute('disabled')).toBeNull();
  });

  it('passes accessibility checks', async () => {
    const { container } = await setup();
    await expectNoA11yViolations(container);
  });
});
