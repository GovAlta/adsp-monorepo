import {
  InternalAdspConversation,
  AdspConversationMessage,
  AdspConversationSendEvent,
} from './internal-adsp-conversation';
import { IConversationClient } from '@abgov/adsp-components-core';
import { useConversation } from './useConversation';
import { useState } from 'react';
import { GoabButton, GoabButtonGroup, GoabCallout, GoabModal } from '@abgov/react-components';
import styles from './ADSPConversation.module.css';

export interface ADSPConversationProps {
  client: IConversationClient;
  resourceId: string;
  typeId?: string;
  topic?: string;
  currentUserId?: string;
  canSend?: boolean;
  canDelete?: boolean;
  draft?: string;
  emptyText?: string;
  sendLabel?: string;
  draftPlaceholder?: string;
  commentsPageSize?: number;
  loadOlderLabel?: string;
  testId?: string;
  onDraftChange?: (value: string) => void;
}

export function ADSPConversation({
  client,
  resourceId,
  typeId,
  topic,
  currentUserId,
  canSend,
  canDelete = true,
  draft,
  emptyText,
  sendLabel,
  draftPlaceholder,
  commentsPageSize,
  loadOlderLabel = 'Load older messages',
  testId,
  onDraftChange,
}: ADSPConversationProps) {
  const { messages, loading, loadingOlder, error, canLoadOlder, loadOlder, send, remove } = useConversation({
    client,
    resourceId,
    typeId,
    currentUserId,
    canDelete,
    pageSize: commentsPageSize,
  });
  const [confirmDelete, setConfirmDelete] = useState<string | number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const hasError = !!error;

  const resolvedTopic = topic ?? resourceId ?? 'Conversation';

  const handleDelete = async () => {
    if (confirmDelete === null || isDeleting) {
      return;
    }

    setIsDeleting(true);
    try {
      await remove(confirmDelete);
      setConfirmDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {canLoadOlder && !error && (
        <div className={styles.loadOlder}>
          <GoabButton
            type="secondary"
            size="compact"
            onClick={() => void loadOlder()}
            disabled={loading || loadingOlder}
          >
            {loadingOlder ? 'Loading older messages...' : loadOlderLabel}
          </GoabButton>
        </div>
      )}

      {hasError && (
        <GoabCallout
          type="emergency"
          heading="Unable to load conversation"
          mt="m"
          mb="m"
          testId="goa-conversation-error"
        >
          {error}
        </GoabCallout>
      )}

      <InternalAdspConversation
        topic={resolvedTopic}
        typeId={typeId}
        messages={messages as AdspConversationMessage[]}
        loading={loading}
        error={undefined}
        canSend={hasError ? false : canSend}
        canDelete={canDelete}
        draft={draft}
        emptyText={emptyText}
        sendLabel={sendLabel}
        draftPlaceholder={draftPlaceholder}
        testId={testId}
        onDraftChange={onDraftChange}
        onSend={async (event: AdspConversationSendEvent) => {
          await send(event.content);
        }}
        onDelete={(messageId) => {
          setConfirmDelete(messageId);
        }}
      />

      {confirmDelete !== null && (
        <GoabModal
          heading="Delete message"
          calloutVariant="emergency"
          open={true}
          onClose={() => setConfirmDelete(null)}
          testId="goa-conversation-delete-modal"
          actions={
            <GoabButtonGroup alignment="end">
              <GoabButton type="secondary" size="compact" disabled={isDeleting} onClick={() => setConfirmDelete(null)}>
                Cancel
              </GoabButton>
              <GoabButton
                size="compact"
                variant="destructive"
                disabled={isDeleting}
                onClick={() => void handleDelete()}
              >
                Delete
              </GoabButton>
            </GoabButtonGroup>
          }
        >
          <p>Are you sure you want to delete this messgae?</p>
        </GoabModal>
      )}
    </>
  );
}

export type GoAConversationProps = ADSPConversationProps;
export const GoAConversation = ADSPConversation;
