import React, { FunctionComponent } from 'react';
import { GoabButton, GoabButtonGroup, GoabModal } from '@abgov/react-components';

interface ImportModalProps {
  isOpen: boolean;
  importArray: string[];
  onCancel: () => void;
  onConfirm: () => void;
}

export const ImportModal: FunctionComponent<ImportModalProps> = ({
  isOpen,
  importArray,
  onCancel,
  onConfirm,
}): JSX.Element => {
  const getContent = () => {
    return (
      <ul>
        {importArray.map((key, index) => (
          <li key={key}>{key}</li>
        ))}
      </ul>
    );
  };
  return (
    <GoabModal
      testId="import-configuration-modal"
      open={isOpen}
      heading="The following configuration will be impacted!"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="secondary"
            testId="import-configuration-modal-cancel"
            onClick={() => {
              onCancel();
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            testId="import-configuration-modal-confirm"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            Confirm
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      {getContent()}
    </GoabModal>
  );
};
