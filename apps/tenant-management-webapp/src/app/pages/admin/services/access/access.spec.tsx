import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent, render, waitFor } from '@testing-library/react';

import { KeycloakApi } from '@store/config/models';

import AccessPage from './access';

jest.mock('@store/agent/actions', () => ({
  clearThread: (threadId: string) => ({ type: 'agent/CLEAR_THREAD', threadId }),
  connectAgent: () => ({ type: 'agent/CONNECT_AGENT' }),
  disconnectAgent: () => ({ type: 'agent/DISCONNECT_AGENT' }),
  discardThread: (threadId: string, options: { deleteOnServer: boolean }) => ({
    type: 'agent/DISCARD_THREAD',
    threadId,
    ...options,
  }),
  getAccessScope: () => async () => ({
    status: 'available',
    message: 'You can inspect the mock-realm realm in Development (read-only).',
    environment: { id: 'dev', label: 'Development', host: 'https://access.adsp-dev.gov.ab.ca', readOnly: true },
    realm: { id: 'mock-realm', kind: 'tenant' },
    readOnly: true,
  }),
  messageAgent: (threadId: string, context: Record<string, unknown>, content: unknown) => ({
    type: 'agent/MESSAGE_AGENT',
    threadId,
    context,
    content,
  }),
  startThread: (agent: string, threadId: string) => ({ type: 'agent/START_THREAD', agent, threadId }),
}));

describe('Access Page', () => {
  const mockKeycloak: KeycloakApi = {
    realm: 'mock-realm',
    clientId: '99',
    url: 'https://foo.bar',
  };

  const mockStore = configureStore([thunk]);

  // jsdom has no scrollIntoView; the agent chat auto-scrolls after a delay that slow runners can reach.
  beforeAll(() => {
    Element.prototype.scrollIntoView = jest.fn();
  });

  const users = [
    { id: '1', enabled: true, emailVerified: true },
    { id: '2', enabled: true, emailVerified: true },
    { id: '3', enabled: false, emailVerified: false },
  ];

  const roles = {
    '1': { id: '1', name: 'file-service-admin', userIds: ['1', '2', '3'] },
    '2': { id: '2', name: 'admin', userIds: ['1', '2'] },
    '3': { id: '3', name: 'create-realm', userIds: ['1', '3', '4', '5'] },
    '4': { id: '4', name: 'something important', userIds: ['1', '3', '4', '5', '7'] },
    '5': { id: '5', name: 'security', userIds: ['1'] },
    '6': { id: '6', name: 'networking', userIds: ['2'] },
  };

  it('binds the store user and role data', async () => {
    const store = mockStore({
      config: {
        keycloakApi: mockKeycloak,
        tenantApi: { host: 'foo' },
        serviceUrls: { tenantManagementWebApp: 'http://localhost' },
      },
      access: { users: {}, metrics: { users: 3, activeUsers: 2 }, roles },
      user: { jwt: { token: '' } },
      session: {
        realm: 'core',
        indicator: {
          show: false,
          message: 'loading',
        },
      },
    });

    render(
      <Provider store={store}>
        <AccessPage />
      </Provider>,
    );

    await waitFor(() => {
      const userCount = document.getElementById('user-count').innerHTML;
      expect(userCount).toBe(`${users.length}`);
      const roleCount = document.getElementById('role-count').innerHTML;
      expect(roleCount).toBe(`${Object.values(roles).length}`);
      const activeUserCount = document.getElementById('active-user-count').innerHTML;
      expect(activeUserCount).toBe('2');

      const roleInfoRows = document.querySelectorAll('#role-information tbody tr');
      expect(roleInfoRows.length).toBe(5);
    });
  });

  it('uses the keycloak realm within the store config', async () => {
    const store = mockStore({
      config: {
        keycloakApi: mockKeycloak,
        tenantApi: { host: 'foo' },
        serviceUrls: { tenantManagementWebApp: 'http://localhost' },
      },
      access: { users: {}, metrics: { users: 3, activeUsers: 2 }, roles },
      user: { jwt: { token: '' } },
      session: {
        realm: 'core',
        indicator: {
          show: false,
          message: 'loading',
        },
      },
    });

    const { queryByText } = render(
      <Provider store={store}>
        <AccessPage />
      </Provider>,
    );

    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const state: any = store.getState();

      const link = queryByText('Keycloak admin portal');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toEqual(`${mockKeycloak.url}/admin/${state.session.realm}/console`);
    });
  });

  it('connects the AI agent from its own tab and disconnects when leaving it', async () => {
    const store = mockStore({
      config: {
        keycloakApi: mockKeycloak,
        tenantApi: { host: 'foo' },
        serviceUrls: { tenantManagementWebApp: 'http://localhost' },
        featureFlags: { AccessServiceAI: true },
      },
      access: { users: {}, metrics: { users: 3, activeUsers: 2 }, roles },
      user: { jwt: { token: '' } },
      agent: {
        connected: false,
        threads: {},
        threadMessages: {},
        messages: {},
      },
      session: {
        realm: 'core',
        indicator: {
          show: false,
          message: 'loading',
        },
      },
    });

    const { getByTestId, queryByTestId } = render(
      <Provider store={store}>
        <AccessPage />
      </Provider>,
    );

    expect(queryByTestId('access-service-agent-chat')).toBeNull();
    fireEvent.click(getByTestId('access-ai-agent-tab-btn'));

    expect(getByTestId('access-service-agent-chat')).toBeTruthy();
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        { type: 'agent/CONNECT_AGENT' },
        expect.objectContaining({ type: 'agent/START_THREAD', agent: 'AccessServiceAgent' }),
      ]),
    );
    await waitFor(() => expect(getByTestId('access-scope-banner').getAttribute('data-status')).toBe('available'));
    expect(getByTestId('access-scope-realm').textContent).toBe('mock-realm');

    const sidePanel = getByTestId('access-agent-side-panel');
    expect(sidePanel.contains(getByTestId('access-scope-banner'))).toBe(true);
    expect(sidePanel.querySelector('#topic-select')).not.toBeNull();
    expect(sidePanel.querySelector('goa-details[heading="About the AI agent"]')).not.toBeNull();
    expect(sidePanel.contains(getByTestId('access-service-agent-chat'))).toBe(false);

    fireEvent.click(getByTestId('tab-btn-0'));

    expect(queryByTestId('access-service-agent-chat')).toBeNull();
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'agent/CLEAR_THREAD' }),
        { type: 'agent/DISCONNECT_AGENT' },
      ]),
    );
  });

  it('sends predefined questions in the current conversation instead of starting a new one', async () => {
    const store = mockStore({
      config: {
        keycloakApi: mockKeycloak,
        tenantApi: { host: 'foo' },
        serviceUrls: { tenantManagementWebApp: 'http://localhost' },
        featureFlags: { AccessServiceAI: true },
      },
      access: { users: {}, metrics: { users: 3, activeUsers: 2 }, roles },
      user: { jwt: { token: '' } },
      agent: {
        connected: true,
        threads: {},
        threadMessages: {},
        messages: {},
      },
      session: {
        realm: 'core',
        indicator: {
          show: false,
          message: 'loading',
        },
      },
    });

    const { getByTestId, getByText, container } = render(
      <Provider store={store}>
        <AccessPage />
      </Provider>,
    );

    fireEvent.click(getByTestId('access-ai-agent-tab-btn'));
    await waitFor(() => expect(getByTestId('access-scope-banner').getAttribute('data-status')).toBe('available'));
    fireEvent.change(container.querySelector('#topic-select'), { target: { value: 'environment-realm' } });
    fireEvent.click(getByText('My Realms'));
    fireEvent.click(getByText('Realm Details'));

    const actions = store.getActions();
    const startedThreads = actions.filter(({ type }) => type === 'agent/START_THREAD');
    const messages = actions.filter(({ type }) => type === 'agent/MESSAGE_AGENT');

    expect(startedThreads).toHaveLength(1);
    expect(messages).toHaveLength(2);
    expect(messages.map(({ threadId }) => threadId)).toEqual([startedThreads[0].threadId, startedThreads[0].threadId]);
    expect(messages[0]).toMatchObject({
      context: {
        agentContext: { context: 'environment-realm', subtopic: 'my-realms', agent: 'AccessServiceAgent' },
      },
      content: [{ type: 'text', text: 'Which realms can I inspect in this environment?' }],
    });
  });

  describe('New chat', () => {
    type RecordedAction = { type: string; threadId?: string };

    function createConversation(
      threadId: string,
      questionCount: number,
      replyStreaming: boolean,
      replyInterrupted: boolean,
    ) {
      const messageIds: string[] = [];
      const messages: Record<string, unknown> = {};
      for (let index = 1; index <= questionCount; index++) {
        const last = index === questionCount;
        messageIds.push(`question-${index}`, `reply-${index}`);
        messages[`question-${index}`] = {
          id: `question-${index}`,
          threadId,
          from: 'user',
          content: [{ type: 'text', text: `Question ${index}` }],
        };
        messages[`reply-${index}`] = {
          id: `reply-${index}`,
          threadId,
          from: 'agent',
          content: last ? 'Earlier answer' : `Answer ${index}`,
          streaming: last && replyStreaming,
          ...(last && replyInterrupted ? { interrupted: true } : {}),
          toolCalls: [],
        };
      }
      return { threadMessages: { [threadId]: messageIds }, messages };
    }

    // Puts finished questions and replies in the first thread the page starts. The state is derived from the actions
    // recorded so far and cached per action count, so the store returns the same snapshot until something is dispatched.
    function createChatStore({ replyStreaming = false, replyInterrupted = false, questionCount = 1 } = {}) {
      let cached: { actionCount: number; state: unknown } | undefined;
      return mockStore((actions: RecordedAction[]) => {
        if (cached?.actionCount === actions.length) {
          return cached.state;
        }

        const firstThreadId = actions.find(({ type }) => type === 'agent/START_THREAD')?.threadId;
        const conversation = firstThreadId
          ? createConversation(firstThreadId, questionCount, replyStreaming, replyInterrupted)
          : { threadMessages: {}, messages: {} };
        const state = {
          config: {
            keycloakApi: mockKeycloak,
            tenantApi: { host: 'foo' },
            serviceUrls: { tenantManagementWebApp: 'http://localhost' },
            featureFlags: { AccessServiceAI: true },
          },
          access: { users: {}, metrics: { users: 3, activeUsers: 2 }, roles },
          user: { jwt: { token: '' } },
          agent: {
            connected: true,
            threads: {},
            ...conversation,
          },
          session: { realm: 'core', indicator: { show: false, message: 'loading' } },
        };
        cached = { actionCount: actions.length, state };
        return state;
      });
    }

    function click(container: HTMLElement, testId: string) {
      fireEvent(container.querySelector(`[testid="${testId}"]`) as Element, new CustomEvent('_click'));
    }

    async function openAgentTab(store: ReturnType<typeof createChatStore>) {
      const rendered = render(
        <Provider store={store}>
          <AccessPage />
        </Provider>,
      );
      fireEvent.click(rendered.getByTestId('access-ai-agent-tab-btn'));
      await waitFor(() => expect(rendered.getByText('Earlier answer')).toBeTruthy());
      return rendered;
    }

    it('starts a new thread, deletes the old one on the server and clears the chat', async () => {
      const store = createChatStore();
      const { container, queryByText } = await openAgentTab(store);
      const firstThreadId = (store.getActions() as RecordedAction[]).find(
        ({ type }) => type === 'agent/START_THREAD',
      )?.threadId;

      click(container, 'access-agent-new-chat');
      click(container, 'access-agent-new-chat-confirm');

      const actions = store.getActions() as RecordedAction[];
      expect(actions).toContainEqual({ type: 'agent/DISCARD_THREAD', threadId: firstThreadId, deleteOnServer: true });
      const startedThreads = actions
        .filter(({ type }) => type === 'agent/START_THREAD')
        .map(({ threadId }) => threadId);
      expect(startedThreads).toHaveLength(2);
      expect(startedThreads[1]).not.toBe(firstThreadId);
      await waitFor(() => expect(queryByText('Earlier answer')).toBeNull());
      expect(container.querySelector('goa-button[testid="access-agent-new-chat"]')?.getAttribute('disabled')).toBe(
        'true',
      );
    });

    it('leaves the old thread to expire on the server while a reply is still in progress', async () => {
      const store = createChatStore({ replyStreaming: true });
      const { container } = await openAgentTab(store);

      click(container, 'access-agent-new-chat');
      click(container, 'access-agent-new-chat-confirm');

      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'agent/DISCARD_THREAD', deleteOnServer: false }),
      );
    });

    it('leaves the old thread to expire on the server when a reply was cut off by a reconnect', async () => {
      const store = createChatStore({ replyInterrupted: true });
      const { container } = await openAgentTab(store);

      click(container, 'access-agent-new-chat');

      expect(container.querySelector('goa-modal')?.textContent).not.toContain(
        'The reply in progress will be discarded.',
      );
      click(container, 'access-agent-new-chat-confirm');

      expect(store.getActions()).toContainEqual(
        expect.objectContaining({ type: 'agent/DISCARD_THREAD', deleteOnServer: false }),
      );
    });

    it('suggests a new chat once the conversation is long', async () => {
      const longConversation = await openAgentTab(createChatStore({ questionCount: 10 }));
      expect(longConversation.container.querySelector('[testid="access-agent-long-conversation"]')).not.toBeNull();
      longConversation.unmount();

      const shortConversation = await openAgentTab(createChatStore({ questionCount: 9 }));
      expect(shortConversation.container.querySelector('[testid="access-agent-long-conversation"]')).toBeNull();
    });

    it('does nothing until the user confirms', async () => {
      const store = createChatStore();
      const { container, getByText } = await openAgentTab(store);

      click(container, 'access-agent-new-chat');
      click(container, 'access-agent-new-chat-cancel');

      expect(store.getActions()).not.toContainEqual(expect.objectContaining({ type: 'agent/DISCARD_THREAD' }));
      expect(getByText('Earlier answer')).toBeTruthy();
    });
  });

  it('hides the AI agent tab by default when AccessServiceAI is not enabled', () => {
    const store = mockStore({
      config: {
        keycloakApi: mockKeycloak,
        tenantApi: { host: 'foo' },
        serviceUrls: { tenantManagementWebApp: 'http://localhost' },
      },
      access: { users: {}, metrics: { users: 3, activeUsers: 2 }, roles },
      user: { jwt: { token: '' } },
      agent: {
        connected: false,
        threads: {},
        threadMessages: {},
        messages: {},
      },
      session: {
        realm: 'core',
        indicator: {
          show: false,
          message: 'loading',
        },
      },
    });

    const { queryByTestId } = render(
      <Provider store={store}>
        <AccessPage />
      </Provider>,
    );

    expect(queryByTestId('access-ai-agent-tab-btn')).toBeNull();
    expect(queryByTestId('access-service-agent-chat')).toBeNull();
  });
});
