import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { DiscoveryPanel } from './DiscoveryPanel';
import { expectNoA11yViolations } from './testing/axe';
import { createMockApi } from './testing/createMockApi';
import { DiscoveryState, OpenQuestion, Solution } from './model';

const discovery = (overrides: Partial<DiscoveryState> = {}): DiscoveryState => ({
  messages: [
    { role: 'assistant', content: 'Who are the users? What steps do they take?', at: '2026-03-01T10:00:00.000Z' },
  ],
  confidence: 30,
  threshold: 50,
  factors: [],
  ready: false,
  mode: 'ai',
  updatedOn: '2026-03-01T10:00:00.000Z',
  ...overrides,
});

const solution = (d?: DiscoveryState, questions: OpenQuestion[] = []): Solution =>
  ({
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
      questions,
      hypotheses: [],
      specialists: [],
      nextSteps: [],
      discovery: d,
    },
  }) as Solution;

const click = (container: HTMLElement, testId: string) =>
  fireEvent(container.querySelector(`goa-button[testid="${testId}"]`) as Element, new CustomEvent('_click'));

const type = (container: HTMLElement, value: string) =>
  fireEvent(
    container.querySelector('goa-textarea[testid="discovery-input"]') as Element,
    new CustomEvent('_change', { detail: { value } }),
  );

describe('DiscoveryPanel', () => {
  it('shows the optional question count and start over', async () => {
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel
        solution={solution(discovery(), [
          { id: 'q1', question: 'Who reviews applications?', raisedBy: 'planner', status: 'open' },
        ])}
        api={api}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );

    expect(container.textContent).toContain('Who are the users? What steps do they take?');
    expect(container.querySelector('[data-testid="discovery-conversation"]')).not.toBeNull();
    expect(container.querySelector('[testid="discovery-force"]')?.textContent).toBe('Skip and show me a plan');
    expect(container.querySelector('[testid="discovery-restart"]')).not.toBeNull();
  });

  it('shows which analysis mode discovery actions will use', async () => {
    const aiApi = createMockApi();
    const { container, rerender } = render(
      <DiscoveryPanel solution={solution(discovery())} api={aiApi} mode="ai" onSolutionChange={jest.fn()} />,
    );

    expect(container.querySelector('[data-testid="discovery-mode-hint"]')?.textContent).toContain('Using AI analysis');

    const rulesApi = createMockApi();
    rerender(
      <DiscoveryPanel solution={solution(discovery())} api={rulesApi} mode="rules" onSolutionChange={jest.fn()} />,
    );

    expect(container.querySelector('[data-testid="discovery-mode-hint"]')?.textContent).toContain(
      'Using rule-based analysis',
    );
  });

  it('sends the user answers together in one reply', async () => {
    const result = solution(discovery());
    const api = createMockApi({ discovery: jest.fn().mockResolvedValue(result) });
    const onSolutionChange = jest.fn();
    const { container } = render(
      <DiscoveryPanel
        solution={solution(discovery(), [
          { id: 'q1', question: 'Who reviews applications?', raisedBy: 'planner', status: 'open' },
        ])}
        api={api}
        mode="ai"
        onSolutionChange={onSolutionChange}
      />,
    );

    type(container, 'Staff review applications; applicants receive email updates.');
    click(container, 'discovery-send');
    await waitFor(() =>
      expect(api.discovery).toHaveBeenCalledWith('solution-1', {
        mode: 'ai',
        message: 'Staff review applications; applicants receive email updates.',
      }),
    );
    expect(api.blueprint).not.toHaveBeenCalled();
    expect(onSolutionChange).toHaveBeenCalledWith(result);
  });

  it('lets the user skip low-confidence discovery and requests a plan', async () => {
    const result = solution(discovery({ ready: true }));
    const api = createMockApi({ discovery: jest.fn().mockResolvedValue(result) });
    const onSolutionChange = jest.fn();
    const { container } = render(
      <DiscoveryPanel solution={solution(discovery())} api={api} mode="ai" onSolutionChange={onSolutionChange} />,
    );

    click(container, 'discovery-force');

    await waitFor(() => expect(api.discovery).toHaveBeenCalledWith('solution-1', { mode: 'ai', force: true }));
    expect(onSolutionChange).toHaveBeenCalledWith(result);
  });

  it('refines through conversation when discovery is ready and there are no open questions', async () => {
    const ready = solution(discovery({ ready: true, confidence: 75 }));
    const api = createMockApi({ chat: jest.fn().mockResolvedValue(ready) });
    const { container } = render(<DiscoveryPanel solution={ready} api={api} mode="ai" onSolutionChange={jest.fn()} />);

    expect(container.querySelectorAll('goa-textarea[testid="discovery-input"]')).toHaveLength(1);
    type(container, 'Add more information about the approval process.');
    click(container, 'discovery-send');
    await waitFor(() =>
      expect(api.chat).toHaveBeenCalledWith('solution-1', 'Add more information about the approval process.', 'ai'),
    );
    expect(api.discovery).not.toHaveBeenCalled();
  });

  it('keeps the latest exchange expanded and collapses earlier turns behind a labeled toggle', async () => {
    const existing = solution(discovery());
    existing.state.conversation = [
      { role: 'user', content: 'There is also a committee vote.', at: '2026-03-01T10:01:00.000Z' },
      { role: 'assistant', content: 'I will include the committee vote.', at: '2026-03-01T10:02:00.000Z' },
    ];
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel solution={existing} api={api} mode="ai" onSolutionChange={jest.fn()} />,
    );

    const conversation = container.querySelector('[data-testid="discovery-conversation"]');
    expect(conversation?.querySelectorAll('[testid^="discovery-message-"]')).toHaveLength(3);
    const earlier = conversation?.querySelector('[testid="discovery-earlier-conversation"]');
    expect(earlier?.getAttribute('heading')).toBe('Show earlier conversation (1)');
    expect(earlier?.hasAttribute('open')).toBe(false);
    expect(conversation?.textContent).toContain('Who are the users? What steps do they take?');
    expect(conversation?.textContent).toContain('There is also a committee vote.');
    expect(container.querySelectorAll('[data-testid="discovery-conversation"]')).toHaveLength(1);
  });

  it('keeps the initial "enough detail" greeting visible as history once a real reply arrives', async () => {
    const confident = solution();
    confident.state.confidence = { score: 60, threshold: 50, factors: [] };
    const replied = {
      ...confident,
      state: {
        ...confident.state,
        discovery: discovery({
          confidence: 73,
          messages: [
            { role: 'user', content: 'The data is Protected B.', at: '2026-03-01T10:01:00.000Z' },
            { role: 'assistant', content: 'Thanks, noted.', at: '2026-03-01T10:02:00.000Z' },
          ],
        }),
      },
    };
    const api = createMockApi({ chat: jest.fn().mockResolvedValue(replied) });
    const { container, rerender } = render(
      <DiscoveryPanel solution={confident} api={api} mode="ai" onSolutionChange={jest.fn()} />,
    );
    expect(container.querySelector('[data-testid="discovery-conversation"]')?.textContent).toContain(
      'Your problem statement already gives me enough detail (confidence 60%)',
    );

    rerender(<DiscoveryPanel solution={replied} api={api} mode="ai" onSolutionChange={jest.fn()} />);

    const conversation = container.querySelector('[data-testid="discovery-conversation"]');
    expect(conversation?.textContent).toContain('Your problem statement already gives me enough detail');
    expect(conversation?.textContent).toContain('Thanks, noted.');
  });

  it('keeps discovery actions and the reply box when no questions were needed', async () => {
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel solution={solution()} api={api} mode="ai" onSolutionChange={jest.fn()} />,
    );

    expect(container.querySelector('goa-textarea[testid="discovery-input"]')).not.toBeNull();
    expect(container.querySelector('[testid="discovery-send"]')).not.toBeNull();
    expect(container.querySelector('[testid="discovery-force"]')).toBeNull();
    expect(container.querySelector('[testid="discovery-restart"]')).not.toBeNull();
  });

  it('restarts discovery', async () => {
    const api = createMockApi({ discovery: jest.fn().mockResolvedValue(solution(discovery())) });
    const { container } = render(
      <DiscoveryPanel solution={solution(discovery())} api={api} mode="ai" onSolutionChange={jest.fn()} />,
    );

    click(container, 'discovery-restart');
    await waitFor(() => expect(api.discovery).toHaveBeenCalledWith('solution-1', { mode: 'ai', restart: true }));
  });

  it('shows a fallback note only when discovery reports one', async () => {
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel
        solution={solution(discovery({ warning: 'AI unavailable; rules were used.' }))}
        api={api}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );
    expect(container.querySelector('[testid="discovery-warning"]')?.textContent).toContain('AI unavailable');
  });

  it('passes accessibility checks', async () => {
    const { container } = render(
      <DiscoveryPanel solution={solution(discovery())} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );
    await expectNoA11yViolations(container);
  });
});
