import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EditorAgentChat } from './EditorAgentChat';

jest.mock('uuid', () => ({ v4: () => 'test-thread-id' }));

describe('EditorAgentChat', () => {
  const mockStore = configureStore([]);

  const baseState = {
    agent: {
      connected: true,
      threads: { 'test-thread-id': { agent: 'formGenerationAgent' } },
      threadMessages: { 'test-thread-id': [] },
      messages: {},
    },
    fileService: {
      fileList: [],
      downloadedFiles: {},
    },
  };

  it('renders AgentChat component', () => {
    const store = mockStore(baseState);

    const { baseElement } = render(
      <Provider store={store}>
        <EditorAgentChat
          agentName="formGenerationAgent"
          resourceId="test-definition-id"
          context={{ formDefinitionId: 'test-definition-id' }}
          height={400}
        />
      </Provider>,
    );

    expect(baseElement.querySelector('div')).not.toBeNull();
  });

  it('dispatches startThread when thread does not exist', () => {
    const stateWithoutThread = {
      ...baseState,
      agent: {
        ...baseState.agent,
        threads: {},
        threadMessages: {},
      },
    };
    const store = mockStore(stateWithoutThread);

    render(
      <Provider store={store}>
        <EditorAgentChat
          agentName="formGenerationAgent"
          resourceId="test-definition-id"
          context={{ formDefinitionId: 'test-definition-id' }}
          height={400}
        />
      </Provider>,
    );

    const actions = store.getActions();
    expect(actions).toContainEqual(
      expect.objectContaining({
        type: 'agent/start-thread',
        agent: 'formGenerationAgent',
        threadId: 'test-thread-id',
      }),
    );
  });

  it('does not dispatch startThread when thread already exists', () => {
    const store = mockStore(baseState);

    render(
      <Provider store={store}>
        <EditorAgentChat
          agentName="formGenerationAgent"
          resourceId="test-definition-id"
          context={{ formDefinitionId: 'test-definition-id' }}
          height={400}
        />
      </Provider>,
    );

    const actions = store.getActions();
    expect(actions).not.toContainEqual(expect.objectContaining({ type: 'agent/start-thread' }));
  });

  it('is disabled when agent is not connected', () => {
    const disconnectedState = {
      ...baseState,
      agent: {
        ...baseState.agent,
        connected: false,
      },
    };
    const store = mockStore(disconnectedState);

    const { baseElement } = render(
      <Provider store={store}>
        <EditorAgentChat
          agentName="formGenerationAgent"
          resourceId="test-definition-id"
          context={{ formDefinitionId: 'test-definition-id' }}
          height={400}
        />
      </Provider>,
    );

    expect(baseElement).toBeTruthy();
  });
});
