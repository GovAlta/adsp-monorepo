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
  it('shows the optional question count and start over', () => {
    const { container } = render(
      <DiscoveryPanel
        solution={solution(discovery(), [
          { id: 'q1', question: 'Who reviews applications?', raisedBy: 'planner', status: 'open' },
        ])}
        api={createMockApi()}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );

    expect(container.textContent).toContain('Who are the users? What steps do they take?');
    expect(container.querySelector('[testid="discovery-questions"]')?.getAttribute('heading')).toBe('Questions');
    expect(container.querySelector('[testid="discovery-questions"]')?.getAttribute('secondarytext')).toBeNull();
    expect(container.querySelector('[testid="discovery-force"]')).toBeNull();
    expect(container.querySelector('[testid="discovery-restart"]')).not.toBeNull();
  });

  it('groups optional questions, conversation, and one shared answer box in the same panel', () => {
    const { container } = render(
      <DiscoveryPanel
        solution={solution(discovery(), [
          { id: 'q1', question: 'Who reviews applications?', raisedBy: 'planner', status: 'open' },
          { id: 'q2', question: 'What documents are required?', raisedBy: 'planner', status: 'open' },
        ])}
        api={createMockApi()}
        mode="ai"
        onSolutionChange={jest.fn()}
      />,
    );

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
    expect(container.querySelector('goa-form-item')?.getAttribute('label')).toBe('Add details or answer questions');
    expect(container.querySelector('goa-textarea[testid="discovery-input"]')?.getAttribute('arialabel')).toBe(
      'Add details or answer questions',
    );
    expect(container.querySelector('goa-textarea[testid="discovery-input"]')?.getAttribute('placeholder')).toBe(
      'Answer questions, add details, or correct anything the planner got wrong.',
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

  it('shows existing discovery and refinement messages in a collapsed conversation panel', () => {
    const existing = solution(discovery());
    existing.state.conversation = [
      { role: 'user', content: 'There is also a committee vote.', at: '2026-03-01T10:01:00.000Z' },
      { role: 'assistant', content: 'I will include the committee vote.', at: '2026-03-01T10:02:00.000Z' },
    ];
    const { container } = render(
      <DiscoveryPanel solution={existing} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );

    const conversation = container.querySelector('[testid="discovery-conversation"]');
    expect(conversation?.getAttribute('heading')).toBe('Conversation');
    expect(conversation?.hasAttribute('open')).toBe(false);
    expect(conversation?.querySelectorAll('[testid^="discovery-message-"]')).toHaveLength(3);
    expect(conversation?.textContent).toContain('Who are the users? What steps do they take?');
    expect(conversation?.textContent).toContain('There is also a committee vote.');
    expect(container.querySelectorAll('[testid="discovery-conversation"]')).toHaveLength(1);
  });

  it('keeps discovery actions and the reply box when no questions were needed', () => {
    const { container } = render(
      <DiscoveryPanel solution={solution()} api={createMockApi()} mode="ai" onSolutionChange={jest.fn()} />,
    );

    expect(container.querySelector('goa-textarea[testid="discovery-input"]')).not.toBeNull();
    expect(container.querySelector('[testid="discovery-send"]')).not.toBeNull();
    expect(container.querySelector('[testid="discovery-force"]')).toBeNull();
    expect(container.querySelector('[testid="discovery-restart"]')).not.toBeNull();
  });

  it('shows service choices beside the specialist chat in the optional accordion', () => {
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
    const { container } = render(
      <DiscoveryPanel
        solution={planned}
        api={createMockApi()}
        mode="ai"
        onSolutionChange={jest.fn()}
        specialists={specialists}
      />,
    );

    const expertAccordion = container.querySelector('[testid="optional-experts"]');
    expect(expertAccordion?.getAttribute('heading')).toBe('Chat/Consult with Specialist');
    expect(expertAccordion?.hasAttribute('open')).toBe(false);
    expect(expertAccordion?.querySelector('[testid="specialist-service-form-service"]')?.textContent).toContain(
      'Form (recommended)',
    );
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
      expect(container.querySelector('[testid="specialist-service-form-service"]')?.textContent).toContain(
        'Form (recommended) (2)',
      ),
    );
    expect(container.querySelector('[testid="specialist-service-file-service"]')?.textContent).toBe('File (1)');
  });

  it('restarts discovery', async () => {
    const api = createMockApi({ discovery: jest.fn().mockResolvedValue(solution(discovery())) });
    const { container } = render(
      <DiscoveryPanel solution={solution(discovery())} api={api} mode="ai" onSolutionChange={jest.fn()} />,
    );

    click(container, 'discovery-restart');
    await waitFor(() => expect(api.discovery).toHaveBeenCalledWith('solution-1', { mode: 'ai', restart: true }));
  });

  it('shows a fallback note only when discovery reports one', () => {
    const { container } = render(
      <DiscoveryPanel
        solution={solution(discovery({ warning: 'AI unavailable; rules were used.' }))}
        api={createMockApi()}
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
