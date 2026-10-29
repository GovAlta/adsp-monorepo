import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import { GoabCallout, GoabDetails } from '@abgov/react-components';
import { AgentChat, AgentContextSelection, UserContent } from '@core-services/app-common';
import { AgentContextSelector } from './AgentContextSelector';
import { AccessScopeBanner } from './AccessScopeBanner';
import { renderAccessToolCall } from './AccessToolCall';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@store/index';
import {
  clearThread,
  connectAgent,
  disconnectAgent,
  discardThread,
  messageAgent,
  startThread,
} from '@store/agent/actions';
import { agentConnectedSelector, messagesSelector } from '@store/agent/selectors';
import { AgentChatContainer, AgentHeader, AgentLayout, AgentSidePanel } from './styled-component';
import { NoPaddingH2 } from '@components/AppHeader';
import { v4 as uuid } from 'uuid';
import { useRemainingViewportHeight } from './useRemainingViewportHeight';
import { NewChatButton } from './NewChatButton';
import { countQuestions, isAwaitingReply, LONG_CONVERSATION_QUESTION_COUNT, mayStillBeSavingReply } from './chatState';

const ACCESS_SERVICE_AGENT_ID = 'AccessServiceAgent';
const CHAT_BOTTOM_GAP_PX = 24;

export const AccessServiceAgent = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const [threadId, setThreadId] = useState(() => uuid());
  const agentConnected = useSelector(agentConnectedSelector);
  const messages = useSelector((state: RootState) => messagesSelector(state, threadId));
  const chatRef = useRef<HTMLDivElement>(null);
  const chatHeight = useRemainingViewportHeight(chatRef, CHAT_BOTTOM_GAP_PX);
  const awaitingReply = isAwaitingReply(messages);
  const isLongConversation = countQuestions(messages) >= LONG_CONVERSATION_QUESTION_COUNT;

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

  // A new thread ID starts a chat with no context, since agent memory is per thread. The old thread is deleted on the
  // server unless a reply may still be being saved to it; it then expires on its own.
  const startNewChat = () => {
    dispatch(discardThread(threadId, { deleteOnServer: !mayStillBeSavingReply(messages) }));
    setThreadId(uuid());
  };

  // Predefined questions continue the current conversation so the agent keeps earlier context.
  const handleAskQuestion = (question: string, context: AgentContextSelection) => {
    const content: UserContent = [{ type: 'text', text: question }];
    dispatch(messageAgent(threadId, { agentContext: context }, content));
  };

  return (
    <section>
      <AgentHeader>
        <NoPaddingH2>Access Service troubleshooting assistant</NoPaddingH2>
        <NewChatButton hasMessages={messages.length > 0} awaitingReply={awaitingReply} onNewChat={startNewChat} />
      </AgentHeader>
      <AgentLayout>
        <AgentChatContainer
          ref={chatRef}
          data-testid="access-service-agent-chat"
          style={chatHeight ? ({ '--agent-chat-height': `${chatHeight}px` } as CSSProperties) : undefined}
        >
          <AgentChat
            key={threadId}
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
          {isLongConversation && (
            <GoabCallout
              type="information"
              size="medium"
              heading="Long conversation"
              mb="none"
              testId="access-agent-long-conversation"
            >
              If answers start to drift, use <strong>New chat</strong> to start again without the earlier context.
            </GoabCallout>
          )}
          <AgentContextSelector key={threadId} onAskQuestion={handleAskQuestion} disabled={!agentConnected} />
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
