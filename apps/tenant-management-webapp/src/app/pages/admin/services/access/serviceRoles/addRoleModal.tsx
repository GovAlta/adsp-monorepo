import React from 'react';
import { GoabButton, GoabModal, GoabButtonGroup } from '@abgov/react-components';
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
    return <span>We will create {clientId} client and its related roles based on configuration.</span>;
  }

  if (status === ServiceRoleSyncStatus.missingClientRole) {
    return (
      <span>
        We will create {role} in {clientId} based on configuration.
      </span>
    );
  }

  if (status === ServiceRoleSyncStatus.notInTenantAdmin) {
    return (
      <span>
        We will add {clientId}:{role} to tenant-admin role of the urn:adsp:platform:tenant-service client.
      </span>
    );
  }
};

export const ConfirmationModal = ({ clientId, onCancel, role, status }: ConfirmationModalProps): JSX.Element => {
  const dispatch = useDispatch();

  return (
    <GoabModal
      heading="Add role"
      open={true}
      key="add-service-role-confirmation-modal"
      testId="add-service-role-confirmation-modal"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="secondary"
            testId="add-service-role-modal-cancel-btn"
            key="add-service-role-modal-cancel"
            onClick={() => {
              onCancel();
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            testId="add-service-role-modal-ok-btn"
            key="add-service-role-modal-ok"
            onClick={() => {
              dispatch(createKeycloakRole(clientId, role));
              onCancel();
            }}
          >
            Add
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <CreateConfirmationMessage status={status} role={role} clientId={clientId} />
    </GoabModal>
  );
};
