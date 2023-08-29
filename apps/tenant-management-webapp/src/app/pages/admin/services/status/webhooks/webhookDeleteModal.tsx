import React from 'react';
import { useDispatch } from 'react-redux';
import { DeleteWebhookService } from '@store/status/actions';
import { Webhooks } from '@store/status/models';
import { DeleteModal } from '@components/DeleteModal';
interface WebhookDeleteModalProps {
  isOpen: boolean;
  onCancel: () => void;
  webhook: Webhooks;
}

export const WebhookDeleteModal = ({ isOpen, onCancel, webhook }: WebhookDeleteModalProps): JSX.Element => {
  const dispatch = useDispatch();
  return (
    <DeleteModal
      title="Delete webhook"
      isOpen={isOpen}
      onCancel={onCancel}
      content={
        <p>
          Are you sure you wish to delete #<b>{`${webhook?.name}?`}</b>
        </p>
      }
      onDelete={() => {
        dispatch(DeleteWebhookService(webhook));
        onCancel();
      }}
    />
  );
};
