import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { SolutionWorkplace } from './SolutionWorkplace';
import { usePlannerApi } from './api';
import { layoutPanes, solutionModeKey } from './workplaceLayout';
import { expectNoA11yViolations } from './testing/axe';
import { createMockApi, MockPlannerApi } from './testing/createMockApi';
import { download } from './utils';
import { ChatSummary, Solution, SpecialistDefinition } from './model';

jest.mock('./api', () => ({ usePlannerApi: jest.fn() }));
jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('./utils', () => ({ ...jest.requireActual('./utils'), download: jest.fn() }));

const goa = (container: HTMLElement, testId: string) => container.querySelector(`[testid="${testId}"]`) as Element;
const click = (container: HTMLElement, testId: string) => fireEvent(goa(container, testId), new CustomEvent('_click'));
const type = (container: HTMLElement, testId: string, value: string) =>
  fireEvent(goa(container, testId), new CustomEvent('_change', { detail: { name: 'x', value } }));
const paneIds = (container: HTMLElement, column: number) =>
  Array.from(container.querySelectorAll(`[data-testid="pane-column-${column}"] > section`)).map((s) =>
    s.getAttribute('data-testid'),
  );

const baseSolution = (state: Partial<Solution['state']> = {}, name = 'Permit intake'): Solution => ({
  id: 'solution-1',
  name,
  scenario: 'new',
  status: 'draft',
  createdByName: 'Pat',
  updatedOn: '2026-03-01T10:00:00.000Z',
  revision: 1,
  state: {
    problemStatement: 'Applicants submit permits.',
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
    concepts: [{ id: 'c1', type: 'actor', name: 'applicant', source: 'extracted' }],
    questions: [
      { id: 'q1', question: 'Is review needed?', raisedBy: 'planner', status: 'open' },
      { id: 'q2', question: 'Is a fee collected?', raisedBy: 'planner', status: 'answered', answer: 'No' },
    ],
    patternMatches: [
      {
        patternId: 'p1',
        patternName: 'Permitting',
        score: 9,
        level: 'high',
        matchedLanguage: [],
        matchedSignals: [],
        explanation: 'Looks like permitting.',
      },
      {
        patternId: 'p2',
        patternName: 'Case management',
        score: 4,
        level: 'medium',
        matchedLanguage: [],
        matchedSignals: [],
        explanation: 'Could be cases.',
      },
    ],
    hypotheses: [
      {
        id: 'h1',
        title: 'Permitting solution',
        patternId: 'p1',
        confidence: 'high',
        rationale: 'A permitting problem.',
        recommendations: [
          { service: 'file-service', reason: 'Documents.', order: 2 },
          { service: 'form-service', reason: 'Intake.', order: 1 },
        ],
        assumptions: ['Applicants sign in'],
        unknowns: ['Retention'],
      },
      {
        id: 'h2',
        title: 'Alternative approach',
        patternId: 'p2',
        confidence: 'low',
        rationale: 'Another way.',
        recommendations: [{ service: 'task-service', reason: 'Tasks.', order: 1 }],
        assumptions: [],
        unknowns: [],
      },
    ],
    nextSteps: [{ title: 'Define forms', service: 'form-service', reason: 'Start intake.' }],
    conversation: [
      { role: 'user', content: 'Add detail', at: '2026-03-01T10:00:00.000Z' },
      { role: 'assistant', content: 'Noted', at: '2026-03-01T10:00:00.000Z' },
    ],
    confidence: { score: 70, threshold: 50, factors: [{ id: 'f', label: 'Actors', score: 70 }] },
    ...extra,
  });

const readyDiscovery = {
  messages: [{ role: 'assistant' as const, content: 'Who are the users?', at: '2026-03-01T10:00:00.000Z' }],
  confidence: 70,
  threshold: 50,
  factors: [],
  ready: true,
  mode: 'ai' as const,
  updatedOn: '2026-03-01T10:00:00.000Z',
};

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
  {
    service: 'file-service',
    displayName: 'File service',
    purpose: 'Files',
    order: 2,
    questions: [],
    dependsOn: [],
    risks: [],
    workspacePath: '',
  },
] as SpecialistDefinition[];

const chat = (id: string, service: string): ChatSummary => ({
  id,
  service,
  title: id,
  createdOn: '2026-03-01T10:00:00.000Z',
  updatedOn: '2026-03-01T10:00:00.000Z',
  messageCount: 2,
});

describe('layoutPanes', () => {
  const panes = [5, 3, 1, 4, 2].map((id) => ({ id, node: `pane ${id}` }));

  it('stacks the panes in numeric order in one column', () => {
    expect(layoutPanes('one', panes).map((c) => c.map((p) => p.id))).toEqual([[1, 2, 3, 4, 5]]);
  });

  it('splits 1,2,4 left and 3,5 right in two columns', () => {
    expect(layoutPanes('two', panes).map((c) => c.map((p) => p.id))).toEqual([
      [1, 2, 4],
      [3, 5],
    ]);
  });

  it('supports custom right panes and skips empty panes', () => {
    const result = layoutPanes('two', [...panes, { id: 6, node: null }], [2]);
    expect(result.map((c) => c.map((p) => p.id))).toEqual([[1, 3, 4, 5], [2]]);
  });
});

describe('SolutionWorkplace', () => {
  let api: MockPlannerApi;
  const onBack = jest.fn();

  const setup = async (solution: Solution = analyzed({ discovery: readyDiscovery }), overrides = {}) => {
    api = createMockApi({
      getSolution: jest.fn().mockResolvedValue(solution),
      getAnalysisOptions: jest.fn().mockResolvedValue({ modes: ['ai', 'rules'], defaultMode: 'ai' }),
      listSpecialists: jest.fn().mockResolvedValue(specialists),
      listChats: jest
        .fn()
        .mockResolvedValue([chat('c1', 'form-service'), chat('c2', 'form-service'), chat('c3', 'form-service')]),
      listPatterns: jest.fn().mockResolvedValue([
        {
          id: 'p2',
          name: 'Case management',
          description: '',
          domainLanguage: [],
          commonFeatures: ['Intake'],
          serviceMappings: [{ service: 'task-service', reason: 'Tasks' }],
          clarifyingQuestions: [],
        },
      ]),
      ...overrides,
    });
    (usePlannerApi as jest.Mock).mockReturnValue(api);
    const result = render(<SolutionWorkplace solutionId="solution-1" onBack={onBack} />);
    await waitFor(() => expect(result.container.querySelector('[data-testid="solution-workplace"]')).not.toBeNull());
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());
    return result;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    (useSelector as jest.Mock).mockImplementation((selector) => selector({ session: { resourceAccess: undefined } }));
  });

  it('shows a progress indicator while loading', () => {
    (usePlannerApi as jest.Mock).mockReturnValue(
      createMockApi({ getSolution: jest.fn().mockReturnValue(new Promise(() => undefined)) }),
    );
    const { container } = render(<SolutionWorkplace solutionId="solution-1" />);

    expect(container.querySelector('goa-circular-progress')).not.toBeNull();
  });

  it('returns to the list when the solution cannot be loaded', async () => {
    (usePlannerApi as jest.Mock).mockReturnValue(
      createMockApi({ getSolution: jest.fn().mockRejectedValue(new Error('missing')) }),
    );
    render(<SolutionWorkplace solutionId="solution-1" onBack={onBack} />);

    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });

  it('defaults to the workplace tabs with AI analysis', async () => {
    const { container, getByTestId } = await setup();

    expect(getByTestId('solution-title').textContent).toBe('Permit intake');
    expect(goa(container, 'focus-workplace').getAttribute('type')).toBe('primary');
    expect(goa(container, 'analysis-mode-ai').getAttribute('type')).toBe('primary');
    const tabs = Array.from(container.querySelectorAll('[data-testid^="tab-"][data-testid$="-tab-btn"]')).map(
      (b) => b.textContent,
    );
    expect(tabs).toEqual([
      'Problem & analysis',
      'Conversation',
      'Hypotheses',
      'Concepts',
      'Questions',
      'Next steps',
      'Blueprint',
    ]);
    expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
  });

  it('uses rule-based analysis when AI is unavailable', async () => {
    const { container } = await setup(undefined, {
      getAnalysisOptions: jest.fn().mockResolvedValue({ modes: ['rules'], defaultMode: 'rules' }),
    });

    expect(goa(container, 'analysis-mode-rules').getAttribute('type')).toBe('primary');
    expect(goa(container, 'analysis-mode-ai').getAttribute('disabled')).toBe('true');
  });

  it('falls back to defaults when options, specialists and chats fail', async () => {
    const { container } = await setup(undefined, {
      getAnalysisOptions: jest.fn().mockRejectedValue(new Error('x')),
      listSpecialists: jest.fn().mockRejectedValue(new Error('x')),
      listChats: jest.fn().mockRejectedValue(new Error('x')),
    });

    expect(goa(container, 'analysis-mode-rules').getAttribute('type')).toBe('primary');
    expect(container.querySelector('[data-testid="rail-no-specialists"]')?.textContent).toContain(
      'No specialists available',
    );
  });

  it('switches analysis mode', async () => {
    const { container } = await setup();

    click(container, 'analysis-mode-rules');

    expect(goa(container, 'analysis-mode-rules').getAttribute('type')).toBe('primary');
  });

  describe('Problem & analysis tab', () => {
    it('shows the pattern matches below the problem statement', async () => {
      const { container } = await setup();

      expect(container.textContent).toContain('Looks like permitting.');
      expect(container.querySelector('[testid="pattern-matches-table"]')).not.toBeNull();
    });

    it('saves and analyzes the problem statement with the analysis mode', async () => {
      const updated = analyzed({ discovery: readyDiscovery, problemStatement: 'New text' });
      const { container } = await setup(undefined, {
        updateSolution: jest.fn().mockResolvedValue(updated),
        analyze: jest.fn().mockResolvedValue(updated),
      });

      type(container, 'problem-input', 'New text');
      click(container, 'problem-analyze');

      await waitFor(() => expect(api.analyze).toHaveBeenCalledWith('solution-1', { mode: 'ai' }));
      expect(api.updateSolution).toHaveBeenCalledWith('solution-1', { problemStatement: 'New text' });
    });

    it('saves the problem statement without analyzing', async () => {
      const { container } = await setup(undefined, {
        updateSolution: jest.fn().mockResolvedValue(analyzed({ discovery: readyDiscovery })),
      });

      expect(goa(container, 'problem-save').getAttribute('disabled')).toBe('true');
      type(container, 'problem-input', 'Edited');
      click(container, 'problem-save');

      await waitFor(() =>
        expect(api.updateSolution).toHaveBeenCalledWith('solution-1', { problemStatement: 'Edited' }),
      );
      expect(api.analyze).not.toHaveBeenCalled();
    });

    it('shows busy state and resets it after an error', async () => {
      let reject: (e: Error) => void;
      const { container } = await setup(undefined, {
        updateSolution: jest.fn().mockReturnValue(new Promise((_, r) => (reject = r))),
      });

      click(container, 'problem-analyze');
      await waitFor(() => expect(container.querySelector('goa-circular-progress')).not.toBeNull());
      expect(goa(container, 'problem-analyze').getAttribute('disabled')).toBe('true');
      await act(async () => reject(new Error('boom')));

      await waitFor(() => expect(container.querySelector('goa-circular-progress')).toBeNull());
      expect(goa(container, 'problem-analyze').getAttribute('disabled')).toBeNull();
    });
  });

  const openTab = (container: HTMLElement, testId: string) =>
    fireEvent.click(container.querySelector(`[data-testid="${testId}-tab-btn"]`) as Element);

  describe('Conversation tab', () => {
    it('sends a refine message', async () => {
      localStorage.setItem(solutionModeKey('solution-1'), 'mode1');
      const updated = analyzed({ discovery: readyDiscovery });
      const { container } = await setup(undefined, { chat: jest.fn().mockResolvedValue(updated) });
      openTab(container, 'tab-conversation');

      expect(goa(container, 'refine-send').getAttribute('disabled')).toBe('true');
      type(container, 'refine-input', '  More detail ');
      click(container, 'refine-send');

      await waitFor(() => expect(api.chat).toHaveBeenCalledWith('solution-1', 'More detail', 'ai'));
      await waitFor(() => expect(goa(container, 'refine-input').getAttribute('value')).toBe(''));
      expect(goa(container, 'refine-message-0').getAttribute('heading')).toBe('You');
    });

    it('defaults to Guided Discovery and shows the discovery conversation', async () => {
      const { container } = await setup(baseSolution());
      openTab(container, 'tab-conversation');

      expect(goa(container, 'solution-mode-mode2').getAttribute('type')).toBe('primary');
      expect(container.querySelector('[data-testid="discovery-panel"]')).not.toBeNull();
      expect(goa(container, 'discovery-start')).not.toBeNull();
    });

    it('switches to Rapid Recommend and persists the choice per solution', async () => {
      const { container } = await setup();
      openTab(container, 'tab-conversation');

      click(container, 'solution-mode-mode1');

      expect(container.querySelector('[data-testid="discovery-panel"]')).toBeNull();
      expect(container.querySelector('[data-testid="refine-chat"]')).not.toBeNull();
      expect(localStorage.getItem(solutionModeKey('solution-1'))).toBe('mode1');
    });
  });

  describe('Hypotheses, Concepts and Next steps tabs', () => {
    it('shows hypotheses, concepts and next steps for an analyzed solution', async () => {
      const { container } = await setup();

      openTab(container, 'tab-hypotheses');
      expect(goa(container, 'hypothesis-h1').hasAttribute('open')).toBe(true);
      expect(container.textContent).toContain('1. form-service');

      openTab(container, 'tab-concepts');
      expect(container.querySelector('[testid="concepts-table"]')).not.toBeNull();

      openTab(container, 'tab-steps');
      expect(container.textContent).toContain('Define forms');
    });

    it('shows empty states for an analysis without results', async () => {
      const { container } = await setup(
        baseSolution({ analysis: { mode: 'rules', warning: 'Fell back', analyzedOn: '2026-03-01T10:00:00.000Z' } }),
      );

      openTab(container, 'tab-hypotheses');
      expect(container.textContent).toContain('Run an analysis to see solution hypotheses.');
      openTab(container, 'tab-concepts');
      expect(container.textContent).toContain('No concepts yet.');
      openTab(container, 'tab-steps');
      expect(container.textContent).toContain('Run an analysis to get next steps.');
    });
  });

  describe('Questions tab', () => {
    it('prompts for analysis when nothing has been analyzed', async () => {
      const { container } = await setup(baseSolution());
      openTab(container, 'tab-questions');

      expect(container.querySelector('[data-testid="questions-pane"]')?.textContent).toContain(
        'Save and analyze the problem first',
      );
    });

    it('answers a question and refines the analysis', async () => {
      const updated = analyzed();
      const { container } = await setup(undefined, {
        answerQuestion: jest.fn().mockResolvedValue(updated),
        analyze: jest.fn().mockResolvedValue(updated),
      });
      openTab(container, 'tab-questions');

      type(container, 'answer-q1', 'Yes, by staff');
      click(container, 'save-answer-q1');
      await waitFor(() => expect(api.answerQuestion).toHaveBeenCalledWith('solution-1', 'q1', 'Yes, by staff'));
      expect(goa(container, 'save-answer-q2').textContent).toBe('Update answer');

      click(container, 'save-answer-q2');
      await waitFor(() => expect(api.answerQuestion).toHaveBeenCalledWith('solution-1', 'q2', 'No'));

      click(container, 'refine-analysis');
      await waitFor(() => expect(api.analyze).toHaveBeenCalledWith('solution-1', { mode: 'ai' }));
    });
  });

  describe('Blueprint tab', () => {
    it('shows the blueprint for an analyzed solution', async () => {
      const { container } = await setup();
      openTab(container, 'tab-blueprint');

      expect(container.textContent).toContain('Generate blueprint');
    });
  });

  describe('Specialists rail', () => {
    it('shows specialist counts and opens a specialist chat', async () => {
      const { container } = await setup();

      expect(goa(container, 'focus-specialist-form-service').textContent).toBe('Form (3)');
      expect(goa(container, 'focus-specialist-form-service').querySelector('strong')).toBeNull();
      expect(goa(container, 'focus-specialist-file-service').textContent).toBe('File');

      click(container, 'focus-specialist-file-service');

      await waitFor(() =>
        expect(container.querySelector('[data-testid="chat-heading"]')?.textContent).toContain('File service'),
      );
      expect(api.listChats).toHaveBeenCalledWith({ service: 'file-service', solutionId: 'solution-1' });
      expect(goa(container, 'focus-specialist-file-service').getAttribute('type')).toBe('primary');
    });

    it('refreshes counts when chats change', async () => {
      const { container } = await setup(undefined, {
        specialistChat: jest.fn().mockResolvedValue({
          chatId: 'c9',
          service: 'file-service',
          mode: 'ai',
          reply: 'Hi',
          suggestions: [],
          samples: [],
          followUps: [],
        }),
      });
      click(container, 'focus-specialist-file-service');
      await waitFor(() => expect(container.querySelector('[data-testid="chat-heading"]')).not.toBeNull());
      const before = api.listChats.mock.calls.length;

      type(container, 'chat-input', 'Hello');
      await waitFor(() => expect(goa(container, 'chat-send').getAttribute('disabled')).toBeNull());
      click(container, 'chat-send');

      await waitFor(() => expect(api.specialistChat).toHaveBeenCalled());
      await waitFor(() => expect(api.listChats.mock.calls.length).toBeGreaterThan(before + 1));
    });

    it('returns to the workplace tabs', async () => {
      const { container } = await setup();

      click(container, 'focus-specialist-file-service');
      await waitFor(() => expect(container.querySelector('[data-testid="chat-heading"]')).not.toBeNull());
      click(container, 'focus-workplace');

      expect(container.querySelector('[data-testid="tab-problem-tab-btn"]')).not.toBeNull();
    });
  });

  describe('Patterns rail', () => {
    it('shows the pattern catalog', async () => {
      const { container } = await setup(undefined, {
        listPatterns: jest.fn().mockResolvedValue([
          {
            id: 'p2',
            name: 'Case management',
            description: '',
            domainLanguage: [],
            commonFeatures: ['Intake'],
            serviceMappings: [{ service: 'task-service', reason: 'Tasks' }],
            clarifyingQuestions: [],
          },
        ]),
      });

      click(container, 'focus-patterns');

      await waitFor(() => expect(container.querySelector('[testid="patterns-table"]')).not.toBeNull());
      expect(container.textContent).toContain('Case management');
    });
  });

  it('has no accessibility violations', async () => {
    const { container } = await setup();

    await expectNoA11yViolations(container);
  });

  describe('header', () => {
    it('renames the solution', async () => {
      const { container, getByTestId } = await setup(undefined, {
        updateSolution: jest.fn().mockResolvedValue(baseSolution({}, 'Renamed')),
      });

      click(container, 'rename-solution');
      expect(goa(container, 'rename-save').getAttribute('disabled')).toBeNull();
      type(container, 'rename-input', '   ');
      expect(goa(container, 'rename-save').getAttribute('disabled')).toBe('true');
      type(container, 'rename-input', ' Renamed ');
      click(container, 'rename-save');

      await waitFor(() => expect(getByTestId('solution-title').textContent).toBe('Renamed'));
      expect(api.updateSolution).toHaveBeenCalledWith('solution-1', { name: 'Renamed' });
    });

    it('cancels a rename', async () => {
      const { container, getByTestId } = await setup();

      click(container, 'rename-solution');
      click(container, 'rename-cancel');

      expect(getByTestId('solution-title').textContent).toBe('Permit intake');
    });

    it('keeps the rename form open when saving fails', async () => {
      const { container } = await setup(undefined, { updateSolution: jest.fn().mockRejectedValue(new Error('x')) });

      click(container, 'rename-solution');
      click(container, 'rename-save');

      await waitFor(() => expect(api.updateSolution).toHaveBeenCalled());
      await waitFor(() => expect(goa(container, 'rename-save').getAttribute('disabled')).toBeNull());
      expect(goa(container, 'rename-input')).not.toBeNull();
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
      expect(download).toHaveBeenCalledWith(
        'planner-permit-intake.md',
        expect.stringContaining('# Permit intake'),
        'text/markdown',
      );
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

    it('navigates back', async () => {
      const { container } = await setup();

      click(container, 'back-to-solutions');

      expect(onBack).toHaveBeenCalled();
    });

    it('omits the back button when no handler is supplied', async () => {
      (usePlannerApi as jest.Mock).mockReturnValue(
        createMockApi({ getSolution: jest.fn().mockResolvedValue(baseSolution()) }),
      );
      const { container } = render(<SolutionWorkplace solutionId="solution-1" />);
      await waitFor(() => expect(goa(container, 'delete-solution')).not.toBeNull());

      expect(goa(container, 'back-to-solutions')).toBeNull();
    });
  });
});
