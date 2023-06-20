import React from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';
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
          Deleting the webhook <b>{`${webhook.name}`}</b> cannot be undone.
        </p>
        <p>
          <b>Are you sure you want to continue?</b>
        </p>{' '}
        <GoAModalActions>
          <GoAButton
            buttonType="secondary"
            data-testid="webhook-delete-modal-delete-cancel"
            onClick={() => {
              onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            data-testid="webhook-delete-modal-delete-btn"
            onClick={() => {
              dispatch(DeleteWebhookService(webhook));
              onCancel();
            }}
          >
            Delete
          </GoAButton>
        </GoAModalActions>
      </GoAModalContent>
    </GoAModal>
  );
};
