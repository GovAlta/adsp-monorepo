import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentChatStatusBar } from './AgentChatStatusBar';

jest.mock('@store/agent/actions', () => ({
  resetThread: (threadId: string) => ({ type: 'agent/RESET_THREAD', threadId }),
}));

const mockStore = configureStore([]);
const THREAD_ID = 'thread-1';
const TEST_ID = 'pdf-editor-agent';

const question = {
  id: 'question-1',
  threadId: THREAD_ID,
  from: 'user',
  content: [{ type: 'text', text: 'Add a header' }],
};
const reply = {
  id: 'reply-1',
  threadId: THREAD_ID,
  from: 'agent',
  content: 'Added the header.',
  streaming: false,
  toolCalls: [],
  usage: { contextTokens: 29000, contextWindowTokens: 256000, totalTokens: 29000, outputTokens: 900, modelCalls: 4 },
};

function createStore(
  conversationStatus?: Record<string, unknown>,
  messages: Record<string, unknown>[] = [question, reply],
) {
  return mockStore({
    agent: {
      threads: { [THREAD_ID]: { id: THREAD_ID, agent: 'pdfGenerationAgent' } },
      threadMessages: { [THREAD_ID]: messages.map(({ id }) => id) },
      messages: Object.fromEntries(messages.map((message) => [message.id, message])),
      conversationStatus: conversationStatus ? { [THREAD_ID]: conversationStatus } : {},
    },
  });
}

function renderBar(store: ReturnType<typeof createStore>, onReset = jest.fn()) {
  const rendered = render(
    <Provider store={store}>
      <AgentChatStatusBar
        threadId={THREAD_ID}
        onReset={onReset}
        keptContent="Your template isn’t changed."
        testId={TEST_ID}
      />
    </Provider>,
  );
  return { ...rendered, onReset };
}

function click(container: HTMLElement, testId: string) {
  fireEvent(container.querySelector(`[testid="${testId}"]`) as Element, new CustomEvent('_click'));
}

describe('AgentChatStatusBar', () => {
  it('shows the context used and what the last answer used', () => {
    // Arrange
    const store = createStore({ contextTokens: 29000, contextWindowTokens: 256000, state: 'ok' });

    // Act
    const { getByTestId } = renderBar(store);

    // Assert
    expect(getByTestId(`${TEST_ID}-status`)).toHaveTextContent('Context 29k of 256k');
    expect(getByTestId(`${TEST_ID}-status`)).toHaveTextContent('Last answer about 29k tokens');
  });

  it('gives a notice once agent-service reports earlier messages were summarised', () => {
    // Arrange
    const store = createStore({
      contextTokens: 14000,
      contextWindowTokens: 256000,
      state: 'notice',
      reason: 'summarised',
    });

    // Act
    const { getByTestId } = renderBar(store);

    // Assert
    expect(getByTestId(`${TEST_ID}-status`)).toHaveAttribute('data-state', 'notice');
  });

  it('warns once agent-service reports the conversation is close to the limit', () => {
    // Arrange
    const store = createStore({
      contextTokens: 180200,
      contextWindowTokens: 256000,
      state: 'warning',
      reason: 'near-context-limit',
    });

    // Act
    const { getByTestId } = renderBar(store);

    // Assert
    expect(getByTestId(`${TEST_ID}-status`)).toHaveAttribute('data-state', 'warning');
  });

  it('resets the thread and starts a new one once the user confirms', () => {
    // Arrange
    const store = createStore();
    const { container, onReset } = renderBar(store);

    // Act
    click(container, `${TEST_ID}-reset`);
    click(container, `${TEST_ID}-reset-confirm`);

    // Assert
    expect(store.getActions()).toEqual([{ type: 'agent/RESET_THREAD', threadId: THREAD_ID }]);
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('tells the user the template is not changed', () => {
    // Arrange
    const { container } = renderBar(createStore());

    // Act
    click(container, `${TEST_ID}-reset`);

    // Assert
    expect(container.querySelector(`goa-modal[testid="${TEST_ID}-reset-modal"]`)).toHaveTextContent(
      'Your template isn’t changed.',
    );
  });

  it('keeps the conversation when the user cancels', () => {
    // Arrange
    const store = createStore();
    const { container, onReset } = renderBar(store);

    // Act
    click(container, `${TEST_ID}-reset`);
    click(container, `${TEST_ID}-reset-cancel`);

    // Assert
    expect(store.getActions()).toEqual([]);
    expect(onReset).not.toHaveBeenCalled();
  });

  it('cannot reset an empty chat', () => {
    // Act
    const { container } = renderBar(createStore(undefined, []));

    // Assert
    expect(container.querySelector(`goa-button[testid="${TEST_ID}-reset"]`)).toHaveAttribute('disabled', 'true');
  });
});
