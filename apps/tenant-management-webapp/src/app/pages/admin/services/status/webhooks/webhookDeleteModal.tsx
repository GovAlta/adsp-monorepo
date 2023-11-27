import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DeleteWebhookService } from '@store/status/actions';
import { selectWebhookToDeleteInStatus } from '@store/status/selectors';
import { ResetModalState } from '@store/session/actions';
import { DeleteModal } from '@components/DeleteModal';

export const WebhookDeleteModal = (): JSX.Element => {
  const dispatch = useDispatch();
  const webhook = useSelector(selectWebhookToDeleteInStatus);
  // eslint-disable-next-line
  useEffect(() => {}, [webhook]);
  return (
    <DeleteModal
      title="Delete webhook"
      isOpen={webhook !== undefined}
      onCancel={() => {
        dispatch(ResetModalState());
      }}
      content={
        <p>
          Are you sure you wish to delete #<b>{`${webhook?.name}?`}</b>
        </p>
      }
      onDelete={() => {
        dispatch(DeleteWebhookService(webhook));
        dispatch(ResetModalState());
      }}
    />
  );
};
