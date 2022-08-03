import React, { FunctionComponent } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';

import { GoAButton } from '@abgov/react-components';

interface ImportModalProps {
  importArray: string[];
  onCancel: () => void;
  onConfirm: () => void;
}

export const ImportModal: FunctionComponent<ImportModalProps> = ({ importArray, onCancel, onConfirm }): JSX.Element => {
  const getContent = () => {
    return (
      <ul>
        {importArray.map((key, index) => (
          <li>{key}</li>
        ))}
      </ul>
    );
  };
  return (
    <>
      <GoAModal testId="import-configuration-modal" isOpen={true}>
        <GoAModalTitle>The following configuration will be impacted!</GoAModalTitle>
        <GoAModalContent>{getContent()}</GoAModalContent>
        <GoAModalActions>
          <GoAButton
            buttonType="secondary"
            data-testid="import-configuration-modal-cancel"
            onClick={() => {
              onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="import-configuration-modal-confirm"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            Confirm
          </GoAButton>
        </GoAModalActions>
      </GoAModal>
    </>
  );
};
