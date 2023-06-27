import React from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { useDispatch } from 'react-redux';
import { DeleteWebhookService } from '@store/status/actions';
import { Webhooks } from '@store/status/models';

interface WebhookDeleteModalProps {
  onCancel: () => void;
  webhook: Webhooks;
}

export const WebhookDeleteModal = ({ onCancel, webhook }: WebhookDeleteModalProps): JSX.Element => {
  const dispatch = useDispatch();

  return (
    <GoAModal testId="webhook-delete-modal" isOpen={true}>
      <GoAModalTitle testId="webhook-delete-modal-title">Delete webhook</GoAModalTitle>
      <GoAModalContent testId="webhook-delete-modal-content">
        <p>
          Delete <b>{`${webhook?.name} (ID: ${webhook?.id})?`}</b>
        </p>

        <GoAModalActions>
          <GoAButtonGroup alignment="end">
            <GoAButton
              type="secondary"
              testId="webhook-delete-modal-delete-cancel"
              onClick={() => {
                onCancel();
              }}
            >
              Cancel
            </GoAButton>
            <GoAButton
              type="primary"
              variant="destructive"
              testId="webhook-delete-modal-delete-btn"
              onClick={() => {
                dispatch(DeleteWebhookService(webhook));
                onCancel();
              }}
            >
              Delete
            </GoAButton>
          </GoAButtonGroup>
        </GoAModalActions>
      </GoAModalContent>
    </GoAModal>
  );
};
