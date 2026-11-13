import React, { CSSProperties, useEffect, useRef, useState } from 'react';
import { GoabCallout, GoabDetails } from '@abgov/react-components';
import {
  AgentChat,
  AgentContextSelection,
  ConversationStatus,
  describeConversationStatus,
  ResetChatButton,
  UserContent,
} from '@core-services/app-common';
import { AgentContextSelector } from './AgentContextSelector';
import { AccessScopeBanner } from './AccessScopeBanner';
import { renderAccessToolCall } from './AccessToolCall';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@store/index';
import {
  answerFromAccessGuide,
  clearThread,
  connectAgent,
  disconnectAgent,
  messageAgent,
  resetThread,
  startThread,
} from '@store/agent/actions';
import {
  agentConnectedSelector,
  conversationStatusSelector,
  lastReplyUsageSelector,
  messagesSelector,
} from '@store/agent/selectors';
import { isAwaitingReply } from '@store/agent/chatState';
import { ACCESS_SERVICE_AGENT_ID, AccessGuideTopic } from '@store/agent/model';
import { AgentChatContainer, AgentHeader, AgentLayout, AgentSidePanel } from './styled-component';
import { NoPaddingH2 } from '@components/AppHeader';
import { v4 as uuid } from 'uuid';
import { useRemainingViewportHeight } from './useRemainingViewportHeight';
import { ConversationMeter } from './ConversationMeter';

const CHAT_BOTTOM_GAP_PX = 24;

/** Whether agent-service has raised a notice or warning about the conversation, such as it getting long. */
function hasConversationConcern(status: ConversationStatus | undefined): boolean {
  return status !== undefined && status.state !== 'ok';
}

export const AccessServiceAgent = (): JSX.Element => {
  const dispatch = useDispatch<AppDispatch>();
  const [threadId, setThreadId] = useState(() => uuid());
  const agentConnected = useSelector(agentConnectedSelector);
  const messages = useSelector((state: RootState) => messagesSelector(state, threadId));
  const chatRef = useRef<HTMLDivElement>(null);
  const chatHeight = useRemainingViewportHeight(chatRef, CHAT_BOTTOM_GAP_PX);
  const awaitingReply = isAwaitingReply(messages);
  const conversationStatus = useSelector((state: RootState) => conversationStatusSelector(state, threadId));
  const lastUsage = useSelector((state: RootState) => lastReplyUsageSelector(state, threadId));
  const statusText = describeConversationStatus(conversationStatus);

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

  // A new thread ID starts a chat with no context, since agent memory is per thread.
  const startNewChat = (): string => {
    const newThreadId = uuid();
    dispatch(resetThread(threadId));
    setThreadId(newThreadId);
    return newThreadId;
  };

  // The question is asked before the effect that starts the new thread runs, so the thread is started here.
  const startNewChatForQuestion = (): string => {
    const newThreadId = startNewChat();
    dispatch(startThread(ACCESS_SERVICE_AGENT_ID, newThreadId));
    return newThreadId;
  };

  // Predefined questions continue the current conversation so the agent keeps earlier context. Once agent-service
  // raises a notice or warning about the conversation, they start a new chat instead: every turn sends the whole
  // conversation to the shared model, so a long chat uses more of its capacity.
  const handleAskQuestion = (question: string, context: AgentContextSelection, guideTopic?: AccessGuideTopic) => {
    const questionThreadId = hasConversationConcern(conversationStatus) ? startNewChatForQuestion() : threadId;
    const content: UserContent = [{ type: 'text', text: question }];
    const messageContext = { agentContext: context };

    if (guideTopic) {
      dispatch(answerFromAccessGuide(questionThreadId, guideTopic, messageContext, content));
    } else {
      dispatch(messageAgent(questionThreadId, messageContext, content));
    }
  };

  return (
    <section>
      <AgentHeader>
        <NoPaddingH2>Access Service troubleshooting assistant</NoPaddingH2>
        <ResetChatButton
          hasMessages={messages.length > 0}
          awaitingReply={awaitingReply}
          onReset={startNewChat}
          testId="access-agent-new-chat"
        />
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
            showUsage
            onSend={(activeThreadId, context, content) => dispatch(messageAgent(activeThreadId, context, content))}
          />
        </AgentChatContainer>
        <AgentSidePanel aria-label="Access Service agent details" data-testid="access-agent-side-panel">
          <ConversationMeter status={conversationStatus} usage={lastUsage} />
          {statusText && (
            <GoabCallout
              type={conversationStatus.state === 'warning' ? 'important' : 'information'}
              size="medium"
              heading={statusText.heading}
              mb="none"
              testId="access-agent-conversation-status"
            >
              {statusText.detail} To start fresh, use <strong>Reset chat</strong> at the top.
            </GoabCallout>
          )}
          <AccessScopeBanner />
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
