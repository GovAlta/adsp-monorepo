import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { countChatsByService, SpecialistChat } from './SpecialistChat';
import { createMockApi, MockPlannerApi } from './testing/createMockApi';
import { expectNoA11yViolations } from './testing/axe';
import { ChatSummary, Solution, SpecialistChat as SpecialistChatModel, SpecialistDefinition } from './model';
import { download } from './utils';

jest.mock('./utils', () => ({
  ...jest.requireActual('./utils'),
  download: jest.fn(),
}));

describe('SpecialistChat', () => {
  const specialist: SpecialistDefinition = {
    service: 'form-service',
    displayName: 'Form',
    purpose: 'Forms',
    workspacePath: '/form',
    questions: [],
    dependsOn: [],
    risks: [],
    order: 1,
  };
  const solution = { id: 'sol-1', name: 'Permit intake' } as Solution;
  const summary: ChatSummary = {
    id: 'chat-1',
    service: 'form-service',
    solutionId: 'sol-1',
    title: 'First chat',
    createdOn: '2026-03-01T10:00:00.000Z',
    updatedOn: '2026-03-01T10:00:00.000Z',
    messageCount: 2,
  };
  const storedChat: SpecialistChatModel = {
    id: 'chat-1',
    service: 'form-service',
    title: 'First chat',
    createdOn: '2026-03-01T10:00:00.000Z',
    updatedOn: '2026-03-01T10:00:00.000Z',
    messages: [
      { role: 'user', content: 'Hello there', at: '2026-03-01T10:00:00.000Z' },
      {
        role: 'assistant',
        content: 'Hi, how can I help?',
        at: '2026-03-01T10:00:01.000Z',
        mode: 'rules',
        warning: 'AI unavailable',
        consult: { fit: 'recommended', supports: ['Drafts'], constraints: ['Size'], risks: ['Scope'] },
        validation: { verdict: 'ok', findings: ['Looks fine'] },
        suggestions: ['Use drafts'],
        samples: [{ language: 'ts', title: 'Example', code: 'const a = 1;' }],
        followUps: ['Tell me more'],
      },
    ],
  };
  const reply = {
    chatId: 'chat-2',
    service: 'form-service',
    mode: 'ai' as const,
    reply: 'An answer',
    suggestions: [],
    samples: [],
    followUps: ['Next?'],
  };

  let api: MockPlannerApi;
  const onChatsChanged = jest.fn();

  const renderChat = (props: Partial<React.ComponentProps<typeof SpecialistChat>> = {}) =>
    render(
      <SpecialistChat
        service="form-service"
        specialist={specialist}
        solution={solution}
        api={api}
        mode="ai"
        onChatsChanged={onChatsChanged}
        {...props}
      />,
    );
  const click = (container: HTMLElement, testId: string) =>
    fireEvent(container.querySelector(`[testid="${testId}"]`) as Element, new CustomEvent('_click'));
  const type = (container: HTMLElement, value: string) =>
    fireEvent(
      container.querySelector('goa-textarea[testid="chat-input"]') as Element,
      new CustomEvent('_change', { detail: { name: 'specialist-message', value } }),
    );
  const toggle = (container: HTMLElement, chatId: string, open: boolean) =>
    fireEvent(
      container.querySelector(`goa-accordion[testid="chat-accordion-${chatId}"]`) as Element,
      new CustomEvent('_change', { detail: { open } }),
    );
  const loaded = async (container: HTMLElement) => {
    await waitFor(() => expect(api.listChats).toHaveBeenCalled());
    await waitFor(() =>
      expect(container.querySelector('goa-accordion[testid="chat-accordion-chat-1"]')).not.toBeNull(),
    );
  };

  beforeEach(() => {
    api = createMockApi();
    api.listChats.mockResolvedValue([summary]);
    api.getChat.mockResolvedValue(storedChat);
    api.specialistChat.mockResolvedValue(reply);
    api.consult.mockResolvedValue({
      service: 'form-service',
      fit: 'recommended',
      reason: 'Good for intake',
      questions: ['Who submits?'],
      dependencies: [],
      risks: [],
      supports: ['Drafts'],
      advice: 'Start simple',
      validation: { verdict: 'ok', findings: [] },
    });
    api.exportAllChats.mockResolvedValue({ chats: [storedChat] });
    api.exportChat.mockResolvedValue(storedChat);
    api.deleteChat.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('countChatsByService', () => {
    it('counts chats for each service', () => {
      expect(countChatsByService([summary, summary, { ...summary, service: 'file-service' }])).toEqual({
        'form-service': 2,
        'file-service': 1,
      });
    });

    it('returns an empty record when there are no chats', () => {
      expect(countChatsByService([])).toEqual({});
      expect(countChatsByService(undefined)).toEqual({});
    });
  });

  it('shows the heading with the specialist display name', async () => {
    const { getByTestId, container } = renderChat();
    await loaded(container);

    expect(getByTestId('chat-heading').textContent).toBe('Form');
  });

  it('falls back to the service name without a specialist', async () => {
    const { getByTestId, container } = renderChat({ specialist: undefined });
    await loaded(container);

    expect(getByTestId('chat-heading').textContent).toBe('form-service');
  });

  it('lists chats scoped to the service and solution', async () => {
    const { container } = renderChat();
    await loaded(container);

    expect(api.listChats).toHaveBeenCalledWith({ service: 'form-service', solutionId: 'sol-1' });
    expect(container.textContent).toContain('Saved chats (1)');
  });

  it('shows no saved chats section when listing chats fails', async () => {
    api.listChats.mockRejectedValue(new Error('x'));

    const { container } = renderChat();

    await waitFor(() => expect(api.listChats).toHaveBeenCalled());
    expect(container.querySelector('goa-accordion')).toBeNull();
    expect(container.textContent).not.toContain('Saved chats');
  });

  it('hides the consult button without a solution', async () => {
    const { container } = renderChat({ solution: undefined });
    await waitFor(() => expect(api.listChats).toHaveBeenCalledWith({ service: 'form-service', solutionId: undefined }));

    expect(container.querySelector('goa-button[testid="chat-consult"]')).toBeNull();
  });

  it('consults on the solution, shows the result and refreshes chats', async () => {
    const { container } = renderChat();
    await loaded(container);

    click(container, 'chat-consult');

    await waitFor(() => expect(container.querySelector('[data-testid="chat-draft-turns"]')).not.toBeNull());
    expect(api.consult).toHaveBeenCalledWith('sol-1', 'form-service', { mode: 'ai' });
    await waitFor(() => expect(onChatsChanged).toHaveBeenCalled());
    expect(container.textContent).toContain('Start simple');
    expect(container.textContent).toContain('Good for intake');
  });

  it('opens a saved chat and renders its messages', async () => {
    const { container } = renderChat();
    await loaded(container);

    toggle(container, 'chat-1', true);

    await waitFor(() =>
      expect(container.querySelectorAll('goa-callout[testid="chat-assistant-message"]')).toHaveLength(1),
    );
    expect(container.querySelector('goa-callout[heading="Form"]')).not.toBeNull();
    expect(container.textContent).toContain('AI unavailable');
    expect(container.textContent).toContain('Fit: recommended');
    expect(container.textContent).toContain('Verdict: ok');
    expect(container.textContent).toContain('Use drafts');
    expect(container.querySelector('goa-details[heading="Example"] pre')?.textContent).toBe('const a = 1;');
    expect(container.querySelectorAll('goa-callout[testid="chat-user-message"]')).toHaveLength(1);
    expect(container.querySelector('goa-accordion[testid="chat-accordion-chat-1"]')?.getAttribute('open')).toBe('true');
  });

  it('uses the sample language when it has no title', async () => {
    api.getChat.mockResolvedValue({
      ...storedChat,
      messages: [{ role: 'assistant', content: 'x', at: 'a', samples: [{ language: 'json', title: '', code: '{}' }] }],
    });
    const { container } = renderChat();
    await loaded(container);

    toggle(container, 'chat-1', true);

    await waitFor(() => expect(container.querySelector('goa-details[heading="json"]')).not.toBeNull());
  });

  it('sends a follow-up from an assistant message', async () => {
    const { container } = renderChat();
    await loaded(container);
    toggle(container, 'chat-1', true);
    await waitFor(() => expect(container.querySelector('[testid="chat-follow-up"]')).not.toBeNull());

    click(container, 'chat-follow-up');

    await waitFor(() =>
      expect(api.specialistChat).toHaveBeenCalledWith('form-service', {
        message: 'Tell me more',
        chatId: 'chat-1',
        intent: 'ask',
        solutionId: 'sol-1',
        mode: 'ai',
      }),
    );
  });

  it('sends a message with the selected intent and appends the reply', async () => {
    const { container } = renderChat();
    await loaded(container);

    click(container, 'chat-intent-validate');
    type(container, '  Is this ok?  ');
    click(container, 'chat-send');

    await waitFor(() =>
      expect(container.querySelectorAll('goa-callout[testid="chat-assistant-message"]')).toHaveLength(1),
    );
    expect(api.specialistChat).toHaveBeenCalledWith('form-service', {
      message: 'Is this ok?',
      chatId: undefined,
      intent: 'validate',
      solutionId: 'sol-1',
      mode: 'ai',
    });
    expect(container.textContent).toContain('An answer');
    expect(container.querySelector('goa-callout[testid="chat-user-message"]')?.textContent).toBe('Is this ok?');
    expect(container.querySelector('goa-textarea[testid="chat-input"]')?.getAttribute('value')).toBe('');
    expect(container.querySelector('[testid="chat-download-current-md"]')).not.toBeNull();
  });

  it('does not send blank messages', async () => {
    const { container } = renderChat();
    await loaded(container);

    type(container, '   ');
    click(container, 'chat-send');

    expect(api.specialistChat).not.toHaveBeenCalled();
    expect(container.querySelector('goa-button[testid="chat-send"]')?.getAttribute('disabled')).toBe('true');
  });

  it('disables controls and shows progress while busy', async () => {
    api.specialistChat.mockReturnValue(new Promise(() => undefined));
    const { container } = renderChat();
    await loaded(container);

    type(container, 'Hi');
    click(container, 'chat-send');

    await waitFor(() =>
      expect(container.querySelector('goa-circular-progress[testid="chat-progress"]')?.getAttribute('visible')).toBe(
        'true',
      ),
    );
    expect(container.querySelector('[testid="chat-download-all-md"]')?.getAttribute('disabled')).toBe('true');
    click(container, 'chat-send');
    expect(api.specialistChat).toHaveBeenCalledTimes(1);
  });

  it('recovers when sending fails', async () => {
    api.specialistChat.mockRejectedValue(new Error('boom'));
    const { container } = renderChat();
    await loaded(container);

    type(container, 'Hi');
    click(container, 'chat-send');

    await waitFor(() =>
      expect(
        container.querySelector('goa-circular-progress[testid="chat-progress"]')?.getAttribute('visible'),
      ).toBeNull(),
    );
    expect(container.querySelectorAll('goa-callout[testid="chat-user-message"]')).toHaveLength(0);
  });

  it('starts a new chat', async () => {
    const { container } = renderChat();
    await loaded(container);
    toggle(container, 'chat-1', true);
    await waitFor(() => expect(container.querySelector('[testid="chat-download-current-md"]')).not.toBeNull());

    toggle(container, 'chat-1', false);

    await waitFor(() => expect(container.querySelector('[testid="chat-download-current-md"]')).toBeNull());
    expect(container.querySelectorAll('goa-callout[testid="chat-user-message"]')).toHaveLength(0);
  });

  it('confirms before deleting a chat and clears it when it is open', async () => {
    api.listChats.mockResolvedValueOnce([summary]).mockResolvedValue([]);
    const { container } = renderChat();
    await loaded(container);
    toggle(container, 'chat-1', true);
    await waitFor(() => expect(container.querySelector('[testid="chat-download-current-md"]')).not.toBeNull());

    click(container, 'chat-delete-chat-1');
    expect(container.querySelector('goa-modal[testid="delete-chat-modal"]')).not.toBeNull();
    expect(api.deleteChat).not.toHaveBeenCalled();

    click(container, 'delete-chat-confirm');

    await waitFor(() => expect(api.deleteChat).toHaveBeenCalledWith('chat-1'));
    await waitFor(() => expect(container.querySelector('goa-accordion')).toBeNull());
    expect(container.querySelector('[testid="chat-download-current-md"]')).toBeNull();
    expect(onChatsChanged).toHaveBeenCalled();
  });

  it('cancels a chat delete without calling the api', async () => {
    const { container } = renderChat();
    await loaded(container);

    click(container, 'chat-delete-chat-1');
    click(container, 'delete-chat-cancel');

    expect(container.querySelector('goa-modal')).toBeNull();
    expect(api.deleteChat).not.toHaveBeenCalled();
  });

  it('keeps the open chat when deleting a different chat', async () => {
    api.listChats.mockResolvedValue([summary, { ...summary, id: 'chat-9' }]);
    const { container } = renderChat();
    await waitFor(() =>
      expect(container.querySelector('goa-accordion[testid="chat-accordion-chat-9"]')).not.toBeNull(),
    );
    toggle(container, 'chat-1', true);
    await waitFor(() => expect(container.querySelector('[testid="chat-download-current-md"]')).not.toBeNull());

    click(container, 'chat-delete-chat-9');
    click(container, 'delete-chat-confirm');

    await waitFor(() => expect(api.deleteChat).toHaveBeenCalledWith('chat-9'));
    expect(container.querySelector('[testid="chat-download-current-md"]')).not.toBeNull();
  });

  it('downloads all chats as markdown and JSON', async () => {
    const { container } = renderChat();
    await loaded(container);

    click(container, 'chat-download-all-md');
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    click(container, 'chat-download-all-json');
    await waitFor(() => expect(download).toHaveBeenCalledTimes(2));

    expect(api.exportAllChats).toHaveBeenCalledWith({ service: 'form-service', solutionId: 'sol-1' });
    expect((download as jest.Mock).mock.calls[0][0]).toBe('permit-intake-form-service-chats.md');
    expect((download as jest.Mock).mock.calls[0][1]).toContain('## First chat');
    expect((download as jest.Mock).mock.calls[1][0]).toBe('permit-intake-form-service-chats.json');
    expect(JSON.parse((download as jest.Mock).mock.calls[1][1]).chats).toHaveLength(1);
  });

  it('offers current chat downloads only when a chat is open', async () => {
    const { container } = renderChat();
    await loaded(container);

    expect(container.querySelector('[testid="chat-download-current-md"]')).toBeNull();

    toggle(container, 'chat-1', true);
    await waitFor(() => expect(container.querySelector('[testid="chat-download-current-md"]')).not.toBeNull());
    click(container, 'chat-download-current-md');
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    click(container, 'chat-download-current-json');
    await waitFor(() => expect(download).toHaveBeenCalledTimes(2));

    expect(api.exportChat).toHaveBeenCalledWith('chat-1');
    expect((download as jest.Mock).mock.calls[0][0]).toBe('permit-intake-form-service-chat.md');
    expect((download as jest.Mock).mock.calls[1][0]).toBe('permit-intake-form-service-chat.json');
  });

  it('names downloads generically without a solution', async () => {
    const { container } = renderChat({ solution: undefined });
    await waitFor(() => expect(container.querySelector('[testid="chat-download-all-json"]')).not.toBeNull());

    click(container, 'chat-download-all-json');

    await waitFor(() => expect(download).toHaveBeenCalled());
    expect((download as jest.Mock).mock.calls[0][0]).toBe('planner-form-service-chats.json');
  });

  it('resets the conversation when the service changes', async () => {
    const { container, rerender } = renderChat();
    await loaded(container);
    toggle(container, 'chat-1', true);
    await waitFor(() => expect(container.querySelector('[testid="chat-download-current-md"]')).not.toBeNull());

    await act(async () => {
      rerender(<SpecialistChat service="file-service" solution={solution} api={api} mode="rules" />);
    });

    await waitFor(() =>
      expect(api.listChats).toHaveBeenLastCalledWith({ service: 'file-service', solutionId: 'sol-1' }),
    );
    expect(container.querySelector('[testid="chat-download-current-md"]')).toBeNull();
  });

  it('refreshes saved chats and the open conversation when the solution updates elsewhere, without closing it', async () => {
    const { container, rerender } = renderChat();
    await loaded(container);
    toggle(container, 'chat-1', true);
    await waitFor(() => expect(container.querySelector('[testid="chat-download-current-md"]')).not.toBeNull());

    const updatedChat: SpecialistChatModel = {
      ...storedChat,
      messages: [
        ...storedChat.messages,
        { role: 'assistant', content: 'Consulted again in the background.', at: '2026-03-01T10:05:00.000Z' },
      ],
    };
    api.listChats.mockResolvedValueOnce([{ ...summary, messageCount: 3 }]);
    api.getChat.mockResolvedValueOnce(updatedChat);

    await act(async () => {
      rerender(
        <SpecialistChat
          service="form-service"
          specialist={specialist}
          solution={{ ...solution, updatedOn: '2026-03-01T10:05:00.000Z' }}
          api={api}
          mode="ai"
          onChatsChanged={onChatsChanged}
        />,
      );
    });

    await waitFor(() => expect(container.textContent).toContain('Consulted again in the background.'));
    expect(container.querySelector('[testid="chat-download-current-md"]')).not.toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderChat();
    await loaded(container);
    toggle(container, 'chat-1', true);
    await waitFor(() => expect(container.querySelector('[testid="chat-follow-up"]')).not.toBeNull());

    await expectNoA11yViolations(container);
  });
});
