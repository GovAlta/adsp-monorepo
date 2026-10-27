import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { DiscoveryPanel } from './DiscoveryPanel';
import { expectNoA11yViolations } from './testing/axe';
import { createMockApi } from './testing/createMockApi';
import { ChatSummary, DiscoveryState, OpenQuestion, Solution, SpecialistDefinition } from './model';

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
    version: '1.0',
    versionHistory: [],
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
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    expect(container.textContent).toContain('Who are the users? What steps do they take?');
    expect(container.querySelector('[testid="discovery-questions"]')?.getAttribute('heading')).toBe('Questions');
    expect(container.querySelector('[testid="discovery-questions"]')?.getAttribute('secondarytext')).toBeNull();
    expect(container.querySelector('[testid="discovery-force"]')?.textContent).toBe('Skip and show me a plan');
    expect(container.querySelector('[testid="discovery-restart"]')).not.toBeNull();
  });

  it('shows which analysis mode discovery actions will use', async () => {
    const aiApi = createMockApi();
    const { container, rerender } = render(
      <DiscoveryPanel solution={solution(discovery())} api={aiApi} mode="ai" onSolutionChange={jest.fn()} />,
    );
    await waitFor(() => expect(aiApi.listChats).toHaveBeenCalled());

    expect(container.querySelector('[data-testid="discovery-mode-hint"]')?.textContent).toContain('Using AI analysis');

    const rulesApi = createMockApi();
    rerender(
      <DiscoveryPanel solution={solution(discovery())} api={rulesApi} mode="rules" onSolutionChange={jest.fn()} />,
    );
    await waitFor(() => expect(rulesApi.listChats).toHaveBeenCalled());

    expect(container.querySelector('[data-testid="discovery-mode-hint"]')?.textContent).toContain(
      'Using rule-based analysis',
    );
  });

  it('groups optional questions, conversation, and one shared answer box in the same panel', async () => {
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel
        solution={solution(discovery(), [
          { id: 'q1', question: 'Who reviews applications?', raisedBy: 'planner', status: 'open' },
          { id: 'q2', question: 'What documents are required?', raisedBy: 'planner', status: 'open' },
        ])}
        api={api}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    expect(container.querySelector('[testid="discovery-questions"]')).not.toBeNull();
    expect(container.querySelector('[testid="discovery-questions"]')?.getAttribute('heading')).toBe('Questions');
    expect(container.querySelectorAll('[testid="discovery-questions"] li')).toHaveLength(2);
    expect(container.querySelector('[testid="discovery-questions"]')?.hasAttribute('open')).toBe(false);
    expect(container.querySelectorAll('goa-textarea[testid="discovery-input"]')).toHaveLength(1);
    expect(container.querySelector('[role="group"][aria-label="Discovery actions"]')).not.toBeNull();
    expect(container.textContent).toContain(
      'Refine the analysis by answering optional questions, asking a question, adding more details, or correcting gaps.',
    );
    const discoveryPanel = container.querySelector('[data-testid="discovery-panel"]');
    expect(discoveryPanel?.contains(container.querySelector('[testid="discovery-questions"]'))).toBe(true);
    expect(discoveryPanel?.contains(container.querySelector('goa-textarea[testid="discovery-input"]'))).toBe(true);
    expect(discoveryPanel?.contains(container.querySelector('[testid="discovery-conversation"]'))).toBe(true);
    const conversationHistory = container.querySelector('[testid="discovery-conversation-history"]');
    expect(conversationHistory?.getAttribute('heading')).toBe('Conversation history (1)');
    expect(conversationHistory?.hasAttribute('open')).toBe(false);
    expect(conversationHistory?.querySelector('[testid="discovery-message-0"]')).not.toBeNull();
    expect(conversationHistory?.contains(container.querySelector('goa-textarea[testid="discovery-input"]'))).toBe(
      false,
    );
    expect(container.querySelector('goa-form-item')?.getAttribute('label')).toBe('Additional details');
    expect(container.querySelector('goa-textarea[testid="discovery-input"]')?.getAttribute('arialabel')).toBe(
      'Additional details',
    );
    expect(container.querySelector('goa-textarea[testid="discovery-input"]')?.getAttribute('placeholder')).toBe(
      'Add details, ask a question, or correct anything the planner got wrong.',
    );
    expect(discoveryPanel?.textContent).not.toContain('One reply can cover several questions.');
    expect(container.querySelector('[data-testid="questions-pane"]')).toBeNull();
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

  it('shows an Answer action for an open question and a summary with Show answer/Edit for an answered one', async () => {
    const longAnswer = 'A'.repeat(350);
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel
        solution={solution(discovery(), [
          { id: 'q1', question: 'Who reviews applications?', raisedBy: 'planner', status: 'open' },
          {
            id: 'q2',
            question: 'What documents are required?',
            raisedBy: 'planner',
            status: 'answered',
            answer: longAnswer,
          },
        ])}
        api={api}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    expect(container.querySelector('[testid="discovery-question-status-q1"]')?.getAttribute('content')).toBe('Open');
    expect(container.querySelector('[testid="discovery-question-answer-q1"]')?.textContent).toBe('Answer');
    expect(container.querySelector('[testid="discovery-question-input-q1"]')).toBeNull();
    expect(container.querySelector('[testid="discovery-question-status-q2"]')?.getAttribute('content')).toBe(
      'Answered',
    );
    expect(container.querySelector('[data-testid="discovery-question-summary-q2"]')).toBeNull();
    expect(container.querySelector('[testid="discovery-question-toggle-q2"]')?.textContent).toBe('Show answer');
    expect(container.querySelector('[testid="discovery-question-edit-q2"]')?.textContent).toBe('Edit');
  });

  it('wraps answered questions in a collapsed details section, separate from open questions', async () => {
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel
        solution={solution(discovery(), [
          { id: 'q1', question: 'Who reviews applications?', raisedBy: 'planner', status: 'open' },
          {
            id: 'q2',
            question: 'What documents are required?',
            raisedBy: 'planner',
            status: 'answered',
            answer: 'A photo ID and proof of address.',
          },
        ])}
        api={api}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    const answered = container.querySelector('[testid="discovery-answered-questions"]');
    expect(answered?.getAttribute('heading')).toBe('Answered questions (1)');
    expect(answered?.hasAttribute('open')).toBe(false);
    expect(answered?.querySelector('[data-testid="discovery-question-q2"]')).not.toBeNull();
    expect(answered?.querySelector('[data-testid="discovery-question-q1"]')).toBeNull();
  });

  it('answers an open question independently through its own Save action', async () => {
    const result = solution(discovery());
    const api = createMockApi({ answerQuestion: jest.fn().mockResolvedValue(result) });
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

    click(container, 'discovery-question-answer-q1');
    fireEvent(
      container.querySelector('goa-textarea[testid="discovery-question-input-q1"]') as Element,
      new CustomEvent('_change', { detail: { value: 'Staff review each application.' } }),
    );
    click(container, 'discovery-question-save-q1');

    await waitFor(() =>
      expect(api.answerQuestion).toHaveBeenCalledWith('solution-1', 'q1', 'Staff review each application.'),
    );
    expect(api.discovery).not.toHaveBeenCalled();
    expect(api.chat).not.toHaveBeenCalled();
    expect(onSolutionChange).toHaveBeenCalledWith(result);
  });

  it('expands the full answer when Show answer is clicked, and collapses it again', async () => {
    const longAnswer =
      `${'A photo ID and proof of address, plus a completed application form and a copy of the lease agreement. '.repeat(4)}`.trim();
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel
        solution={solution(discovery(), [
          {
            id: 'q2',
            question: 'What documents are required?',
            raisedBy: 'planner',
            status: 'answered',
            answer: longAnswer,
          },
        ])}
        api={api}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    click(container, 'discovery-question-toggle-q2');
    expect(container.querySelector('[data-testid="discovery-question-summary-q2"]')?.textContent).toBe(longAnswer);
    expect(container.querySelector('[testid="discovery-question-toggle-q2"]')?.textContent).toBe('Hide answer');

    click(container, 'discovery-question-toggle-q2');
    expect(container.querySelector('[testid="discovery-question-toggle-q2"]')?.textContent).toBe('Show answer');
    expect(container.querySelector('[data-testid="discovery-question-summary-q2"]')).toBeNull();
  });

  it('hides the Show/Hide answer toggle when the answer already fits without truncating', async () => {
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel
        solution={solution(discovery(), [
          {
            id: 'q2',
            question: 'What documents are required?',
            raisedBy: 'planner',
            status: 'answered',
            answer: 'A photo ID and proof of address.',
          },
        ])}
        api={api}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    expect(container.querySelector('[data-testid="discovery-question-summary-q2"]')?.textContent).toBe(
      'A photo ID and proof of address.',
    );
    expect(container.querySelector('[testid="discovery-question-toggle-q2"]')).toBeNull();
    expect(container.querySelector('[testid="discovery-question-edit-q2"]')).not.toBeNull();
  });

  it('edits an existing answer, pre-filled with its current text', async () => {
    const result = solution(discovery());
    const api = createMockApi({ answerQuestion: jest.fn().mockResolvedValue(result) });
    const { container } = render(
      <DiscoveryPanel
        solution={solution(discovery(), [
          {
            id: 'q2',
            question: 'What documents are required?',
            raisedBy: 'planner',
            status: 'answered',
            answer: 'A photo ID.',
          },
        ])}
        api={api}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );

    click(container, 'discovery-question-edit-q2');
    expect(container.querySelector('goa-textarea[testid="discovery-question-input-q2"]')?.getAttribute('value')).toBe(
      'A photo ID.',
    );

    fireEvent(
      container.querySelector('goa-textarea[testid="discovery-question-input-q2"]') as Element,
      new CustomEvent('_change', { detail: { value: 'A photo ID and a utility bill.' } }),
    );
    click(container, 'discovery-question-save-q2');

    await waitFor(() =>
      expect(api.answerQuestion).toHaveBeenCalledWith('solution-1', 'q2', 'A photo ID and a utility bill.'),
    );
  });

  it('cancels answering without saving', async () => {
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
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    click(container, 'discovery-question-answer-q1');
    click(container, 'discovery-question-cancel-q1');

    expect(container.querySelector('[testid="discovery-question-input-q1"]')).toBeNull();
    expect(container.querySelector('[testid="discovery-question-answer-q1"]')?.textContent).toBe('Answer');
  });

  it('shows only the top 5 open questions with a Show more action for the rest', async () => {
    const questions: OpenQuestion[] = Array.from({ length: 7 }, (_, i) => ({
      id: `q${i + 1}`,
      question: `Question ${i + 1}?`,
      raisedBy: 'planner',
      status: 'open',
    }));
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel solution={solution(discovery(), questions)} api={api} mode="ai" onSolutionChange={jest.fn()} />,
    );
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    expect(container.querySelectorAll('[testid="discovery-questions"] li')).toHaveLength(5);
    expect(container.querySelector('[testid="discovery-questions-show-more"]')?.textContent).toBe('Show more (2)');

    click(container, 'discovery-questions-show-more');

    expect(container.querySelectorAll('[testid="discovery-questions"] li')).toHaveLength(7);
    expect(container.querySelector('[testid="discovery-questions-show-less"]')).not.toBeNull();
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

  it('keeps existing discovery and refinement messages in a collapsed history section', async () => {
    const existing = solution(discovery());
    existing.state.conversation = [
      { role: 'user', content: 'There is also a committee vote.', at: '2026-03-01T10:01:00.000Z' },
      { role: 'assistant', content: 'I will include the committee vote.', at: '2026-03-01T10:02:00.000Z' },
    ];
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel solution={existing} api={api} mode="ai" onSolutionChange={jest.fn()} />,
    );
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    const conversation = container.querySelector('[testid="discovery-conversation"]');
    expect(conversation?.getAttribute('heading')).toBe('Conversation');
    expect(conversation?.hasAttribute('open')).toBe(true);
    const history = conversation?.querySelector('[testid="discovery-conversation-history"]');
    expect(history?.getAttribute('heading')).toBe('Conversation history (3)');
    expect(history?.hasAttribute('open')).toBe(false);
    expect(history?.querySelectorAll('[testid^="discovery-message-"]')).toHaveLength(3);
    expect(conversation?.textContent).toContain('Who are the users? What steps do they take?');
    expect(conversation?.textContent).toContain('There is also a committee vote.');
    expect(container.querySelectorAll('[testid="discovery-conversation"]')).toHaveLength(1);
  });

  it('keeps discovery actions and the reply box when no questions were needed', async () => {
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel solution={solution()} api={api} mode="ai" onSolutionChange={jest.fn()} />,
    );
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    expect(container.querySelector('goa-textarea[testid="discovery-input"]')).not.toBeNull();
    expect(container.querySelector('[testid="discovery-send"]')).not.toBeNull();
    expect(container.querySelector('[testid="discovery-force"]')).toBeNull();
    expect(container.querySelector('[testid="discovery-restart"]')).not.toBeNull();
  });

  it('shows service choices beside the specialist chat in the optional accordion', async () => {
    const specialists: SpecialistDefinition[] = [
      {
        service: 'form-service',
        displayName: 'Form service',
        purpose: 'Collect applications',
        workspacePath: '',
        questions: [],
        dependsOn: [],
        risks: [],
        order: 1,
      },
      {
        service: 'file-service',
        displayName: 'File service',
        purpose: 'Store supporting documents',
        workspacePath: '',
        questions: [],
        dependsOn: [],
        risks: [],
        order: 2,
      },
    ];
    const planned = solution(discovery());
    planned.state.blueprint = {
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
    } as NonNullable<Solution['state']['blueprint']>;
    const api = createMockApi();
    const { container } = render(
      <DiscoveryPanel solution={planned} api={api} mode="ai" onSolutionChange={jest.fn()} specialists={specialists} />,
    );
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());

    const expertAccordion = container.querySelector('[testid="optional-experts"]');
    expect(expertAccordion?.getAttribute('heading')).toBe('Chat/Consult with Specialist');
    expect(expertAccordion?.hasAttribute('open')).toBe(false);
    expect(expertAccordion?.querySelector('[testid="specialist-service-form-service"]')?.textContent).toBe('Form');
    expect(expertAccordion?.querySelector('[testid="specialist-service-file-service"]')?.textContent).toBe('File');
    const expertLayout = expertAccordion?.querySelector('[data-testid="service-expert-layout"]');
    expect(expertLayout).not.toBeNull();
    expect(expertLayout?.querySelector('[aria-label="Available service experts"]')).not.toBeNull();
    expect(expertLayout?.querySelector('[data-testid="selected-specialist-chat"]')).not.toBeNull();
    expect(expertLayout?.firstElementChild?.nextElementSibling).toBe(
      expertLayout?.querySelector('[data-testid="selected-specialist-chat"]'),
    );
    expect(expertAccordion?.parentElement?.getAttribute('style')).toContain('margin-top: 1.5rem');
    expect(expertAccordion?.querySelector('[testid="specialist-service-form-service"]')?.getAttribute('width')).toBe(
      '100%',
    );
    expect(expertAccordion?.querySelector('[data-testid="selected-specialist-chat"] h2')).toBeNull();
    expect(expertAccordion?.querySelector('[data-testid="chat-heading"]')?.textContent).toBe('Form service');
    expect(expertAccordion?.querySelector('[data-testid="chat-context"]')?.textContent).toBe(
      'Recommended for this plan: Applicants need a form.',
    );
    expect(expertAccordion?.textContent).not.toContain('Specialist chat');
    expect(
      container
        .querySelector('[role="group"][aria-label="Discovery actions"]')
        ?.compareDocumentPosition(expertAccordion as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('shows saved chat counts on the matching specialist buttons', async () => {
    const planned = solution(discovery());
    planned.state.blueprint = {
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
    } as NonNullable<Solution['state']['blueprint']>;
    const savedChats: ChatSummary[] = [
      {
        id: 'form-1',
        service: 'form-service',
        solutionId: planned.id,
        title: 'Form consultation',
        createdOn: '2026-03-01T10:00:00.000Z',
        updatedOn: '2026-03-01T10:00:00.000Z',
        messageCount: 2,
      },
      {
        id: 'form-2',
        service: 'form-service',
        solutionId: planned.id,
        title: 'Form follow-up',
        createdOn: '2026-03-01T10:00:00.000Z',
        updatedOn: '2026-03-01T10:00:00.000Z',
        messageCount: 2,
      },
      {
        id: 'file-1',
        service: 'file-service',
        solutionId: planned.id,
        title: 'File consultation',
        createdOn: '2026-03-01T10:00:00.000Z',
        updatedOn: '2026-03-01T10:00:00.000Z',
        messageCount: 2,
      },
    ];
    const api = createMockApi({ listChats: jest.fn().mockResolvedValue(savedChats) });
    const { container } = render(
      <DiscoveryPanel
        solution={planned}
        api={api}
        mode="ai"
        onSolutionChange={jest.fn()}
        specialists={[
          { service: 'form-service', displayName: 'Form service', purpose: 'Forms', order: 1 } as SpecialistDefinition,
          { service: 'file-service', displayName: 'File service', purpose: 'Files', order: 2 } as SpecialistDefinition,
        ]}
      />,
    );

    await waitFor(() =>
      expect(container.querySelector('[testid="specialist-service-form-service"]')?.textContent).toContain('Form (2)'),
    );
    expect(container.querySelector('[testid="specialist-service-file-service"]')?.textContent).toBe('File (1)');
    expect(container.querySelector('[testid="optional-experts-count"]')?.getAttribute('content')).toBe('2 specialists');
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
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());
    expect(container.querySelector('[testid="discovery-warning"]')?.textContent).toContain('AI unavailable');
  });

  it('passes accessibility checks', async () => {
    const { container } = render(
      <DiscoveryPanel solution={solution(discovery())} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );
    await expectNoA11yViolations(container);
  });
});
