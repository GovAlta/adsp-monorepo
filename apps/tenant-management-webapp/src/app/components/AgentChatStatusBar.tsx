import React, { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConversationStatusBar, ResetChatButton } from '@core-services/app-common';
import { AppDispatch, RootState } from '@store/index';
import { resetThread } from '@store/agent/actions';
import { isAwaitingReply } from '@store/agent/chatState';
import { conversationStatusSelector, lastReplyUsageSelector, messagesSelector } from '@store/agent/selectors';

interface AgentChatStatusBarProps {
  threadId: string;
  /** Starts the new thread once the current one is discarded. */
  onReset: () => void;
  /** What resetting leaves alone, such as the template being edited. */
  keptContent: string;
  testId: string;
}

/**
 * The status bar of an AI chat inside an editor: how much of the context window the conversation takes up, what the
 * last answer used, a warning once the conversation is long, and resetting the chat.
 */
export const AgentChatStatusBar: FunctionComponent<AgentChatStatusBarProps> = ({
  threadId,
  onReset,
  keptContent,
  testId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const messages = useSelector((state: RootState) => messagesSelector(state, threadId));
  const status = useSelector((state: RootState) => conversationStatusSelector(state, threadId));
  const usage = useSelector((state: RootState) => lastReplyUsageSelector(state, threadId));

  const reset = () => {
    dispatch(resetThread(threadId));
    onReset();
  };

  return (
    <ConversationStatusBar
      status={status}
      usage={usage}
      testId={`${testId}-status`}
      action={
        <ResetChatButton
          variant="inline"
          hasMessages={messages.length > 0}
          awaitingReply={isAwaitingReply(messages)}
          onReset={reset}
          keptContent={keptContent}
          testId={`${testId}-reset`}
        />
      }
    />
  );
};
