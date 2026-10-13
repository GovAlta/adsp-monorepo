import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { SolutionWorkplace } from './SolutionWorkplace';
import { usePlannerApi } from './api';
import { layoutPanes, LAYOUT_KEY, solutionModeKey } from './workplaceLayout';
import { expectNoA11yViolations } from './testing/axe';
import { createMockApi, MockPlannerApi } from './testing/createMockApi';
import { download } from './utils';
import { ChatSummary, Solution, SpecialistDefinition } from './model';

jest.mock('./api', () => ({ usePlannerApi: jest.fn() }));
jest.mock('./utils', () => ({ ...jest.requireActual('./utils'), download: jest.fn() }));

const goa = (container: HTMLElement, testId: string) => container.querySelector(`[testid="${testId}"]`) as Element;
const click = (container: HTMLElement, testId: string) => fireEvent(goa(container, testId), new CustomEvent('_click'));
const type = (container: HTMLElement, testId: string, value: string) =>
  fireEvent(goa(container, testId), new CustomEvent('_change', { detail: { name: 'x', value } }));
const paneIds = (container: HTMLElement, column: number) =>
  Array.from(container.querySelectorAll(`[data-testid="pane-column-${column}"] > section`)).map((s) => s.getAttribute('data-testid'));

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
      { patternId: 'p1', patternName: 'Permitting', score: 9, level: 'high', matchedLanguage: [], matchedSignals: [], explanation: 'Looks like permitting.' },
      { patternId: 'p2', patternName: 'Case management', score: 4, level: 'medium', matchedLanguage: [], matchedSignals: [], explanation: 'Could be cases.' },
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
  { service: 'form-service', displayName: 'Form service', purpose: 'Forms', order: 1, questions: [], dependsOn: [], risks: [], workspacePath: '' },
  { service: 'file-service', displayName: 'File service', purpose: 'Files', order: 2, questions: [], dependsOn: [], risks: [], workspacePath: '' },
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
      listChats: jest.fn().mockResolvedValue([chat('c1', 'form-service'), chat('c2', 'form-service'), chat('c3', 'form-service')]),
      listPatterns: jest.fn().mockResolvedValue([
        { id: 'p2', name: 'Case management', description: '', domainLanguage: [], commonFeatures: ['Intake'], serviceMappings: [{ service: 'task-service', reason: 'Tasks' }], clarifyingQuestions: [] },
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
  });

  it('shows a progress indicator while loading', () => {
    (usePlannerApi as jest.Mock).mockReturnValue(createMockApi({ getSolution: jest.fn().mockReturnValue(new Promise(() => undefined)) }));
    const { container } = render(<SolutionWorkplace solutionId="solution-1" />);

    expect(container.querySelector('goa-circular-progress')).not.toBeNull();
  });

  it('returns to the list when the solution cannot be loaded', async () => {
    (usePlannerApi as jest.Mock).mockReturnValue(createMockApi({ getSolution: jest.fn().mockRejectedValue(new Error('missing')) }));
    render(<SolutionWorkplace solutionId="solution-1" onBack={onBack} />);

    await waitFor(() => expect(onBack).toHaveBeenCalled());
  });

  it('defaults to Guided Discovery, one column and AI analysis with ordered panes', async () => {
    const { container, getByTestId } = await setup();

    expect(getByTestId('solution-title').textContent).toBe('Permit intake');
    expect(goa(container, 'solution-mode-mode2').getAttribute('type')).toBe('primary');
    expect(goa(container, 'layout-one').getAttribute('type')).toBe('primary');
    expect(goa(container, 'analysis-mode-ai').getAttribute('type')).toBe('primary');
    const modes = Array.from(container.querySelectorAll('goa-button[testid^="solution-mode-"]')).map((b) => b.textContent);
    expect(modes).toEqual(['Guided Discovery', 'Rapid Recommend', 'Option Explorer']);
    expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
    expect(paneIds(container, 0)).toEqual(['pane-1', 'pane-2', 'pane-3', 'pane-4', 'pane-5']);
    expect(container.querySelector('[data-testid="pane-column-1"]')).toBeNull();
    expect(getByTestId('mode-hint').textContent).toContain('answer the AI follow-up questions');
  });

  it('uses rule-based analysis when AI is unavailable', async () => {
    const { container } = await setup(undefined, { getAnalysisOptions: jest.fn().mockResolvedValue({ modes: ['rules'], defaultMode: 'rules' }) });

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
    expect(container.querySelector('[data-testid="specialist-rail"]')?.textContent).toContain('No specialists available');
  });

  it('switches analysis mode', async () => {
    const { container } = await setup();

    click(container, 'analysis-mode-rules');

    expect(goa(container, 'analysis-mode-rules').getAttribute('type')).toBe('primary');
  });

  it('lays out two columns with 1,2,4 left and 3,5 right and persists the choice', async () => {
    const { container } = await setup();

    click(container, 'layout-two');

    expect(paneIds(container, 0)).toEqual(['pane-1', 'pane-2', 'pane-4']);
    expect(paneIds(container, 1)).toEqual(['pane-3', 'pane-5']);
    expect(localStorage.getItem(LAYOUT_KEY)).toBe('two');
  });

  it('restores the stored layout and mode', async () => {
    localStorage.setItem(LAYOUT_KEY, 'two');
    localStorage.setItem(solutionModeKey('solution-1'), 'mode1');
    const { container } = await setup();

    expect(goa(container, 'solution-mode-mode1').getAttribute('type')).toBe('primary');
    expect(goa(container, 'layout-two').getAttribute('type')).toBe('primary');
    expect(paneIds(container, 0)).toEqual(['pane-1', 'pane-2', 'pane-4']);
  });

  it('ignores invalid stored values', async () => {
    localStorage.setItem(LAYOUT_KEY, 'bogus');
    localStorage.setItem(solutionModeKey('solution-1'), 'bogus');
    const { container } = await setup();

    expect(goa(container, 'solution-mode-mode2').getAttribute('type')).toBe('primary');
    expect(goa(container, 'layout-one').getAttribute('type')).toBe('primary');
  });

  describe('Guided Discovery', () => {
    it('hides refine and specialist panes until discovery is ready', async () => {
      const { container } = await setup(analyzed({ discovery: { ...readyDiscovery, ready: false } }));

      expect(paneIds(container, 0)).toEqual(['pane-1', 'pane-2', 'pane-3']);
      expect(goa(container, 'solution-not-ready')).not.toBeNull();
    });

    it('shows the not-yet message without discovery state', async () => {
      const { container } = await setup(baseSolution());

      expect(goa(container, 'solution-not-ready').textContent).toContain('50%');
      expect(goa(container, 'discovery-start')).not.toBeNull();
    });

    it('shows the proposed solution sections closed by default', async () => {
      const { container } = await setup();

      for (const id of ['hypotheses', 'concepts', 'steps', 'patterns']) {
        expect(goa(container, `section-${id}`).hasAttribute('open')).toBe(false);
      }
      expect(goa(container, 'hypothesis-h1').hasAttribute('open')).toBe(false);
      expect(container.textContent).toContain('1. form-service');
      expect(container.textContent).toContain('Define forms');
      expect(container.textContent).toContain('Looks like permitting.');
      expect(container.textContent).toContain('Project blueprint');
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
      const { container } = await setup(undefined, { updateSolution: jest.fn().mockResolvedValue(analyzed({ discovery: readyDiscovery })) });

      expect(goa(container, 'problem-save').getAttribute('disabled')).toBe('true');
      type(container, 'problem-input', 'Edited');
      click(container, 'problem-save');

      await waitFor(() => expect(api.updateSolution).toHaveBeenCalledWith('solution-1', { problemStatement: 'Edited' }));
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

    it('sends a refine message', async () => {
      const updated = analyzed({ discovery: readyDiscovery });
      const { container } = await setup(undefined, { chat: jest.fn().mockResolvedValue(updated) });

      expect(goa(container, 'refine-send').getAttribute('disabled')).toBe('true');
      type(container, 'refine-input', '  More detail ');
      click(container, 'refine-send');

      await waitFor(() => expect(api.chat).toHaveBeenCalledWith('solution-1', 'More detail', 'ai'));
      await waitFor(() => expect(goa(container, 'refine-input').getAttribute('value')).toBe(''));
      expect(goa(container, 'refine-message-0').getAttribute('heading')).toBe('You');
    });

    it('shows specialist counts and opens a specialist chat', async () => {
      const { container } = await setup();

      expect(goa(container, 'specialist-form-service').textContent).toBe('Form (3)');
      expect(goa(container, 'specialist-form-service').querySelector('strong')).not.toBeNull();
      expect(goa(container, 'specialist-file-service').textContent).toBe('File');
      expect(goa(container, 'specialist-file-service').querySelector('strong')).toBeNull();
      expect(container.querySelector('[data-testid="specialist-hint"]')).not.toBeNull();

      click(container, 'specialist-file-service');

      await waitFor(() => expect(container.querySelector('[data-testid="chat-heading"]')?.textContent).toContain('File service'));
      expect(api.listChats).toHaveBeenCalledWith({ service: 'file-service', solutionId: 'solution-1' });
      expect(goa(container, 'specialist-file-service').getAttribute('type')).toBe('primary');
    });

    it('refreshes counts when chats change', async () => {
      const { container } = await setup(undefined, {
        specialistChat: jest.fn().mockResolvedValue({ chatId: 'c9', service: 'file-service', mode: 'ai', reply: 'Hi', suggestions: [], samples: [], followUps: [] }),
      });
      click(container, 'specialist-file-service');
      await waitFor(() => expect(container.querySelector('[data-testid="chat-heading"]')).not.toBeNull());
      const before = api.listChats.mock.calls.length;

      type(container, 'chat-input', 'Hello');
      await waitFor(() => expect(goa(container, 'chat-send').getAttribute('disabled')).toBeNull());
      click(container, 'chat-send');

      await waitFor(() => expect(api.specialistChat).toHaveBeenCalled());
      await waitFor(() => expect(api.listChats.mock.calls.length).toBeGreaterThan(before + 1));
    });

    it('has no accessibility violations', async () => {
      const { container } = await setup();

      await expectNoA11yViolations(container);
    });
  });

  describe('Rapid Recommend', () => {
    beforeEach(() => localStorage.setItem(solutionModeKey('solution-1'), 'mode1'));

    it('renders the compressed view with sections open and all five panes', async () => {
      const { container } = await setup();

      expect(paneIds(container, 0)).toEqual(['pane-1', 'pane-2', 'pane-3', 'pane-4', 'pane-5']);
      expect(goa(container, 'section-hypotheses').hasAttribute('open')).toBe(true);
      expect(goa(container, 'hypothesis-h1').hasAttribute('open')).toBe(true);
      expect(goa(container, 'hypothesis-h2').hasAttribute('open')).toBe(false);
      expect(container.querySelector('[data-testid="questions-pane"]')).not.toBeNull();
    });

    it('prompts for analysis when nothing has been analyzed', async () => {
      const { container } = await setup(baseSolution());

      expect(container.querySelector('[data-testid="proposed-solution"]')?.textContent).toContain('Analyze the problem');
      expect(container.querySelector('[data-testid="questions-pane"]')?.textContent).toContain('Save and analyze the problem first');
      expect(container.querySelector('[data-testid="refine-empty"]')?.textContent).toContain('AI will answer');
    });

    it('shows empty hypotheses, concepts and steps for an analysis without results', async () => {
      const { container } = await setup(baseSolution({ analysis: { mode: 'rules', warning: 'Fell back', analyzedOn: '2026-03-01T10:00:00.000Z' } }));

      const text = container.querySelector('[data-testid="proposed-solution"]')?.textContent;
      expect(text).toContain('Run an analysis to see solution hypotheses.');
      expect(text).toContain('No concepts yet.');
      expect(text).toContain('Run an analysis to get next steps.');
      expect(text).toContain('Not analyzed yet.');
      expect(goa(container, 'analysis-info').textContent).toContain('Fell back');
    });

    it('answers a question and refines the analysis', async () => {
      const updated = analyzed();
      const { container } = await setup(undefined, {
        answerQuestion: jest.fn().mockResolvedValue(updated),
        analyze: jest.fn().mockResolvedValue(updated),
      });

      type(container, 'answer-q1', 'Yes, by staff');
      click(container, 'save-answer-q1');
      await waitFor(() => expect(api.answerQuestion).toHaveBeenCalledWith('solution-1', 'q1', 'Yes, by staff'));
      expect(goa(container, 'save-answer-q2').textContent).toBe('Update answer');

      click(container, 'save-answer-q2');
      await waitFor(() => expect(api.answerQuestion).toHaveBeenCalledWith('solution-1', 'q2', 'No'));

      click(container, 'refine-analysis');
      await waitFor(() => expect(api.analyze).toHaveBeenCalledWith('solution-1', { mode: 'ai' }));
    });

    it('has no accessibility violations', async () => {
      const { container } = await setup();

      await expectNoA11yViolations(container);
    });
  });

  describe('Option Explorer', () => {
    beforeEach(() => localStorage.setItem(solutionModeKey('solution-1'), 'mode3'));

    it('compares alternatives with the current approach in two columns', async () => {
      localStorage.setItem(LAYOUT_KEY, 'two');
      const { container } = await setup();

      expect(paneIds(container, 0)).toEqual(['pane-1', 'pane-2']);
      expect(paneIds(container, 1)).toEqual(['pane-3', 'pane-5']);
      expect(container.querySelector('[data-testid="current-approach"]')?.textContent).toContain('Permitting solution');
      expect(goa(container, 'alternative-p2').textContent).toContain('Case management');
      await waitFor(() => expect(goa(container, 'alternative-p2').textContent).toContain('Typical workflow'));
      expect(goa(container, 'alt-hypothesis-h2').textContent).toContain('Alternative approach');
    });

    it('handles missing patterns and unanalyzed solutions', async () => {
      const { container } = await setup(baseSolution(), { listPatterns: jest.fn().mockRejectedValue(new Error('x')) });

      expect(container.querySelector('[data-testid="current-approach"]')?.textContent).toContain('Analyze the problem first');
      expect(goa(container, 'alternatives-ai').getAttribute('disabled')).toBe('true');
    });

    it('reports when no other patterns matched', async () => {
      const { container } = await setup(
        analyzed({ patternMatches: [], hypotheses: [] }),
        { listPatterns: jest.fn().mockResolvedValue(undefined) }
      );

      expect(container.querySelector('[data-testid="alternatives"]')?.textContent).toContain('No other strong patterns matched.');
      expect(container.querySelector('[data-testid="current-approach"]')?.textContent).toContain('Initial solution');
    });

    it('asks the AI for more alternatives', async () => {
      const updated = analyzed({
        conversation: [
          { role: 'user', content: 'ask', at: '2026-03-01T10:00:00.000Z' },
          { role: 'assistant', content: 'Try option B', at: '2026-03-01T10:00:00.000Z' },
        ],
      });
      const { container } = await setup(undefined, { chat: jest.fn().mockResolvedValue(updated) });

      click(container, 'alternatives-ai');

      await waitFor(() => expect(goa(container, 'alternatives-reply').textContent).toContain('Try option B'));
      expect(api.chat).toHaveBeenCalledWith('solution-1', expect.stringContaining('alternative workflows'), 'ai');
    });

    it('disables AI alternatives in rule-based only deployments', async () => {
      const { container } = await setup(undefined, { getAnalysisOptions: jest.fn().mockResolvedValue({ modes: ['rules'], defaultMode: 'rules' }) });

      expect(goa(container, 'alternatives-ai').getAttribute('disabled')).toBe('true');
    });

    it('has no accessibility violations', async () => {
      const { container } = await setup();

      await expectNoA11yViolations(container);
    });
  });

  describe('header', () => {
    it('switches modes and persists the choice per solution', async () => {
      const { container } = await setup();

      click(container, 'solution-mode-mode3');

      expect(localStorage.getItem(solutionModeKey('solution-1'))).toBe('mode3');
      expect(container.querySelector('[data-testid="current-approach"]')).not.toBeNull();
      expect(container.querySelector('[data-testid="mode-hint"]')?.textContent).toContain('Compare other ways');
    });

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
      const { container } = await setup(undefined, { exportSolution: jest.fn().mockResolvedValue({ id: 'solution-1' }) });

      click(container, 'download-json');
      await waitFor(() => expect(download).toHaveBeenCalledWith('planner-permit-intake.json', JSON.stringify({ id: 'solution-1' }, null, 2), 'application/json'));

      click(container, 'download-report');
      expect(download).toHaveBeenCalledWith('planner-permit-intake.md', expect.stringContaining('# Permit intake'), 'text/markdown');
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
      (usePlannerApi as jest.Mock).mockReturnValue(createMockApi({ getSolution: jest.fn().mockResolvedValue(baseSolution()) }));
      const { container } = render(<SolutionWorkplace solutionId="solution-1" />);
      await waitFor(() => expect(goa(container, 'delete-solution')).not.toBeNull());

      expect(goa(container, 'back-to-solutions')).toBeNull();
    });
  });
});
