import React, { FunctionComponent, useState } from 'react';
import { GoabButton, GoabButtonGroup, GoabModal } from '@abgov/react-components';

export interface ResetChatButtonProps {
  hasMessages: boolean;
  awaitingReply: boolean;
  onReset: () => void;
  /** 'inline' leaves out the icon, for tight spaces such as the chat status bar. */
  variant?: 'button' | 'inline';
  /** Base test ID. The dialog and its buttons add -modal, -confirm and -cancel. */
  testId?: string;
  /** What starting over leaves alone, such as the template being edited. */
  keptContent?: string;
}

/**
 * Starts a new chat after the user confirms, since the current conversation cannot be recovered once cleared.
 */
export const ResetChatButton: FunctionComponent<ResetChatButtonProps> = ({
  hasMessages,
  awaitingReply,
  onReset,
  variant = 'button',
  testId = 'agent-reset-chat',
  keptContent,
}: ResetChatButtonProps) => {
  const [confirming, setConfirming] = useState(false);

  const confirm = () => {
    setConfirming(false);
    onReset();
  };

  return (
    <>
      <GoabButton
        type="tertiary"
        size="compact"
        leadingIcon={variant === 'button' ? 'reload' : undefined}
        testId={testId}
        disabled={!hasMessages}
        onClick={() => setConfirming(true)}
      >
        Reset chat
      </GoabButton>
      <GoabModal
        testId={`${testId}-modal`}
        open={confirming}
        heading="Start a new chat?"
        maxWidth="560px"
        onClose={() => setConfirming(false)}
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton
              size="compact"
              type="secondary"
              testId={`${testId}-cancel`}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </GoabButton>
            <GoabButton size="compact" type="primary" testId={`${testId}-confirm`} onClick={confirm}>
              Start new chat
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <p>
          Starting a new chat will clear your current conversation and messages.
          {awaitingReply && ' The reply in progress will be discarded.'}
          {keptContent && ` ${keptContent}`} This action cannot be undone. Do you want to continue?
        </p>
      </GoabModal>
    </>
  );
};
