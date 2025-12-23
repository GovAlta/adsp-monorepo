import React, { FunctionComponent } from 'react';
import { GoabButton, GoabModal, GoabButtonGroup } from '@abgov/react-components';

interface SaveFormProps {
  onCancel?: () => void;
  onSave?: () => void;
  onDontSave?: () => void;
  saveDisable?: boolean;
  open: boolean;
}

export const SaveFormModal: FunctionComponent<SaveFormProps> = ({
  onCancel,
  onDontSave,
  onSave,
  saveDisable,
  open,
}) => {
  return (
    <GoabModal
      testId="save-form-modal"
      open={open}
      heading="You have unsaved changes"
      maxWidth="640px"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton testId="form-cancel-modal" type="tertiary" onClick={onCancel}>
            Cancel
          </GoabButton>
          <GoabButton type="secondary" testId="form-dont-save" onClick={() => onDontSave()}>
            Don't save
          </GoabButton>
          <GoabButton type="primary" testId="form-agree-save" disabled={saveDisable} onClick={() => onSave()}>
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      Leaving this page will discard any changes that haven't been saved
    </GoabModal>
  );
};
