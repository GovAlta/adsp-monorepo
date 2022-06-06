import React from 'react';
import { GoAModal, GoAModalActions, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components/experimental';

interface ConfirmationModalProps {
  clientId: string;
  onCancel: () => void;
}

export const ConfirmationModal = ({ clientId, onCancel }: ConfirmationModalProps) => {
  return (
    <GoAModal isOpen={true}>
      <GoAModalTitle>Add the client to keycloak?</GoAModalTitle>
      <GoAModalActions>
        <GoAButton
          buttonType="secondary"
          data-testid="add-service-role-cancel"
          onClick={() => {
            onCancel();
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton buttonType="primary" data-testid="add-service-role-ok" onClick={() => {}}>
          Add
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
