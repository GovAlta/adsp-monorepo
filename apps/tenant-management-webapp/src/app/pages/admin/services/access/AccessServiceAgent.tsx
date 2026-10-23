import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import { GoabDetails } from '@abgov/react-components';
import { AgentChat, AgentContextSelection, UserContent } from '@core-services/app-common';
import { AgentContextSelector } from './AgentContextSelector';
import { AccessScopeBanner } from './AccessScopeBanner';
import { renderAccessToolCall } from './AccessToolCall';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@store/index';
import { clearThread, connectAgent, disconnectAgent, messageAgent, startThread } from '@store/agent/actions';
import { agentConnectedSelector, messagesSelector } from '@store/agent/selectors';
import { AgentChatContainer, AgentLayout, AgentSidePanel } from './styled-component';
import { NoPaddingH2 } from '@components/AppHeader';
import { v4 as uuid } from 'uuid';
import { useRemainingViewportHeight } from './useRemainingViewportHeight';

const ACCESS_SERVICE_AGENT_ID = 'AccessServiceAgent';
const CHAT_BOTTOM_GAP_PX = 24;

export const AccessServiceAgent = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const [threadId] = useState(() => uuid());
  const agentConnected = useSelector(agentConnectedSelector);
  const messages = useSelector((state: RootState) => messagesSelector(state, threadId));
  const chatRef = useRef<HTMLDivElement>(null);
  const chatHeight = useRemainingViewportHeight(chatRef, CHAT_BOTTOM_GAP_PX);

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

  // Predefined questions continue the current conversation so the agent keeps earlier context.
  const handleAskQuestion = (question: string, context: AgentContextSelection) => {
    const content: UserContent = [{ type: 'text', text: question }];
    dispatch(messageAgent(threadId, { agentContext: context }, content));
  };

  return (
    <section>
      <NoPaddingH2>Access Service troubleshooting assistant</NoPaddingH2>
      <AgentLayout>
        <AgentChatContainer
          ref={chatRef}
          data-testid="access-service-agent-chat"
          style={chatHeight ? ({ '--agent-chat-height': `${chatHeight}px` } as CSSProperties) : undefined}
        >
          <AgentChat
            disabled={!agentConnected}
            threadId={threadId}
            context={{}}
            messages={messages}
            welcomeMessage=""
            renderToolCall={renderAccessToolCall}
            onSend={(activeThreadId, context, content) => dispatch(messageAgent(activeThreadId, context, content))}
          />
        </AgentChatContainer>
        <AgentSidePanel aria-label="Access Service agent details" data-testid="access-agent-side-panel">
          <AccessScopeBanner />
          <AgentContextSelector onAskQuestion={handleAskQuestion} disabled={!agentConnected} />
          <GoabDetails heading="About the AI agent" mt="none" mb="none">
            <p>
              The Access Service agent will provide ADSP developers and support staff with a conversational way to
              understand and troubleshoot the Access Service and its underlying Keycloak configuration.
            </p>
          </GoabDetails>
        </AgentSidePanel>
      </AgentLayout>
    </section>
  );
};
