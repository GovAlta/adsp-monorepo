import React, { FunctionComponent, useState } from 'react';
import { GoabButton, GoabButtonGroup, GoabModal } from '@abgov/react-components';

interface NewChatButtonProps {
  hasMessages: boolean;
  awaitingReply: boolean;
  onNewChat: () => void;
}

/**
 * Starts a new chat after the user confirms, since the current conversation cannot be recovered once cleared.
 */
export const NewChatButton: FunctionComponent<NewChatButtonProps> = ({ hasMessages, awaitingReply, onNewChat }) => {
  const [confirming, setConfirming] = useState(false);

  const confirm = () => {
    setConfirming(false);
    onNewChat();
  };

  return (
    <>
      <GoabButton
        type="tertiary"
        size="compact"
        leadingIcon="reload"
        testId="access-agent-new-chat"
        disabled={!hasMessages}
        onClick={() => setConfirming(true)}
      >
        New chat
      </GoabButton>
      <GoabModal
        testId="access-agent-new-chat-modal"
        open={confirming}
        heading="Start a new chat?"
        maxWidth="560px"
        onClose={() => setConfirming(false)}
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              size="compact"
              type="secondary"
              testId="access-agent-new-chat-cancel"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </GoabButton>
            <GoabButton size="compact" type="primary" testId="access-agent-new-chat-confirm" onClick={confirm}>
              Start new chat
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <p>
          The current conversation will be cleared and the agent will not remember it. This cannot be undone.
          {awaitingReply && ' The reply in progress will be discarded.'}
        </p>
      </GoabModal>
    </>
  );
};
