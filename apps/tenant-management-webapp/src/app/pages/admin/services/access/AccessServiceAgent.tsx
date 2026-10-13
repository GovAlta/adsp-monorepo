import React, { useEffect, useState } from 'react';
import { GoabDetails } from '@abgov/react-components';
import { AgentChat, AgentContextSelection, UserContent } from '@core-services/app-common';
import { AgentContextSelector } from './AgentContextSelector';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@store/index';
import { clearThread, connectAgent, disconnectAgent, messageAgent, startThread } from '@store/agent/actions';
import { agentConnectedSelector, messagesSelector } from '@store/agent/selectors';
import { AgentChatContainer } from './styled-component';
import { NoPaddingH2 } from '@components/AppHeader';
import { v4 as uuid } from 'uuid';

const ACCESS_SERVICE_AGENT_ID = 'AccessServiceAgent';

export const AccessServiceAgent = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const [threadId, setThreadId] = useState(() => uuid());
  const agentConnected = useSelector(agentConnectedSelector);
  const messages = useSelector((state: RootState) => messagesSelector(state, threadId));

  useEffect(() => {
    dispatch(connectAgent());

    return () => {
      dispatch(disconnectAgent());
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(startThread(ACCESS_SERVICE_AGENT_ID, threadId));

    return () => {
      dispatch(clearThread(threadId));
    };
  }, [dispatch, threadId]);

  const handleAskQuestion = (question: string, context: AgentContextSelection) => {
    // Create a new thread/session for each predefined question
    const newThreadId = uuid();
    setThreadId(newThreadId);
    // Register the thread synchronously so messageAgent (dispatched below) can find it;
    // the effect above will also dispatch this once React re-renders, which is a harmless no-op.
    dispatch(startThread(ACCESS_SERVICE_AGENT_ID, newThreadId));

    // Send the predefined question to the agent with context
    const content: UserContent = [{ type: 'text', text: question }];
    const contextWithAgentContext = { agentContext: context };
    dispatch(messageAgent(newThreadId, contextWithAgentContext, content));
  };

  return (
    <section>
      <NoPaddingH2>Access Service troubleshooting assistant</NoPaddingH2>
      <GoabDetails heading="About the AI agent">
        <p>
          The Access Service agent will provide ADSP developers and support staff with a conversational way to
          understand and troubleshoot the Access Service and its underlying Keycloak configuration.
        </p>
      </GoabDetails>
      <AgentContextSelector onAskQuestion={handleAskQuestion} disabled={!agentConnected} />
      <AgentChatContainer data-testid="access-service-agent-chat">
        <AgentChat
          disabled={!agentConnected}
          threadId={threadId}
          context={{}}
          messages={messages}
          welcomeMessage=""
          // Hide tool call input/result details; this agent only surfaces conversational replies.
          // Must return a non-null element (not undefined/null) so AgentChat doesn't fall back to its default renderer.
          renderToolCall={() => <span />}
          onSend={(activeThreadId, context, content) => dispatch(messageAgent(activeThreadId, context, content))}
        />
      </AgentChatContainer>
    </section>
  );
};
