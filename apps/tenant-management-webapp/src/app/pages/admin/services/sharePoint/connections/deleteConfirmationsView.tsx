import React, { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { DeleteModal } from '@components/DeleteModal';
import { deleteSharepointConnection, SharepointConnection } from '@store/sharePoint/actions';
import { MarginTop } from '../styled-components';

interface DeleteConnectionProps {
  connection: SharepointConnection;
  destinationNames: string[];
  onClose: () => void;
}

export const DeleteConfirmationsView: FunctionComponent<DeleteConnectionProps> = ({
  connection,
  destinationNames,
  onClose,
}) => {
  const dispatch = useDispatch();

  return (
    <DeleteModal
      title="Delete connection"
      isOpen={true}
      onCancel={onClose}
      content={
        <div>
          Are you sure you want to delete <b>{connection.name}</b>? Its secret is deleted as well.
          {destinationNames.length > 0 && (
            <MarginTop>
              These destinations use this connection and will stop working: {destinationNames.join(', ')}.
            </MarginTop>
          )}
        </div>
      }
      onDelete={() => {
        onClose();
        dispatch(deleteSharepointConnection(connection.id));
      }}
    />
  );
};
