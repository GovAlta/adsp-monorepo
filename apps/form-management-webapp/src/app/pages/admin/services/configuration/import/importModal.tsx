import React, { FunctionComponent } from 'react';
import { GoAButton, GoAButtonGroup, GoAModal } from '@abgov/react-components';

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
    <GoAModal
      testId="import-configuration-modal"
      open={isOpen}
      heading="The following configuration will be impacted!"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="import-configuration-modal-cancel"
            onClick={() => {
              onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="import-configuration-modal-confirm"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            Confirm
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      {getContent()}
    </GoAModal>
  );
};
