import React from 'react';
import { GoAModal, GoAModalActions, GoAModalTitle, GoAModalContent } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';
import { useDispatch } from 'react-redux';
import { createKeycloakRole } from '@store/access/actions';

interface ConfirmationModalProps {
  clientId: string;
  role: string;
  onCancel: () => void;
}

export const ConfirmationModal = ({ clientId, onCancel, role }: ConfirmationModalProps): JSX.Element => {
  const dispatch = useDispatch();
  return (
    <GoAModal isOpen={true} key="add-service-role-confirmation-modal" data-testid="add-service-role-confirmation-modal">
      <GoAModalTitle>Add role</GoAModalTitle>
      <GoAModalContent>
        We will create <b>{clientId}</b> client and its related roles based on configuration.
      </GoAModalContent>
      <GoAModalActions>
        <GoAButton
          buttonType="secondary"
          data-testid="add-service-role-modal-cancel-btn"
          key="add-service-role-modal-cancel"
          onClick={() => {
            onCancel();
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton
          buttonType="primary"
          data-testid="add-service-role-modal-ok-btn"
          key="add-service-role-modal-ok"
          onClick={() => {
            dispatch(createKeycloakRole(clientId, role));
            onCancel();
          }}
        >
          Add
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
