import React from 'react';
import { GoAModal, GoAModalActions, GoAModalTitle, GoAModalContent } from '@abgov/react-components/experimental';
import { GoAButton } from '@abgov/react-components';
import { useDispatch } from 'react-redux';
import { createKeycloakRole } from '@store/access/actions';
import { ServiceRoleSyncStatus } from '@store/access/models';

interface ConfirmationModalProps {
  clientId: string;
  role: string;
  status: ServiceRoleSyncStatus;
  onCancel: () => void;
}

interface ServiceRoleSyncStatusProps {
  status: ServiceRoleSyncStatus;
  clientId: string;
  role: string;
}

const CreateConfirmationMessage = ({ status, clientId, role }: ServiceRoleSyncStatusProps): JSX.Element => {
  if (status === ServiceRoleSyncStatus.missingClient) {
    return (
      <span>
        We will create <b>{clientId}</b> client and its related roles based on configuration.
      </span>
    );
  }

  if (status === ServiceRoleSyncStatus.missingClientRole) {
    return (
      <span>
        We will create <b>{role}</b> in {clientId} based on configuration.
      </span>
    );
  }

  if (status === ServiceRoleSyncStatus.notInTenantAdmin) {
    return (
      <span>
        We will add{' '}
        <b>
          {clientId}:{role}
        </b>{' '}
        to tenant-admin.
      </span>
    );
  }
};

export const ConfirmationModal = ({ clientId, onCancel, role, status }: ConfirmationModalProps): JSX.Element => {
  const dispatch = useDispatch();

  return (
    <GoAModal isOpen={true} key="add-service-role-confirmation-modal" data-testid="add-service-role-confirmation-modal">
      <GoAModalTitle>Add role</GoAModalTitle>
      <GoAModalContent>
        <CreateConfirmationMessage status={status} role={role} clientId={clientId} />
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
