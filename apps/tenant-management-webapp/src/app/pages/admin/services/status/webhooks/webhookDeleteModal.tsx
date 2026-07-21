import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DeleteWebhookService } from '@store/status/actions';
import { selectWebhookToDeleteInStatus } from '@store/status/selectors';
import { ResetModalState } from '@store/session/actions';
import { DeleteModal } from '@components/DeleteModal';

export const WebhookDeleteModal = (): JSX.Element => {
  const dispatch = useDispatch();
  const webhook = useSelector(selectWebhookToDeleteInStatus);

  return (
    <div>
      {webhook && (
        <DeleteModal
          title="Delete webhook"
          isOpen={webhook !== undefined}
          onCancel={() => {
            dispatch(ResetModalState());
          }}
          content={
            <div>
              Are you sure you wish to delete <b>{webhook?.name}</b>?
            </div>
          }
          onDelete={() => {
            dispatch(DeleteWebhookService(webhook));
            dispatch(ResetModalState());
          }}
        />
      )}
    </div>
  );
};
