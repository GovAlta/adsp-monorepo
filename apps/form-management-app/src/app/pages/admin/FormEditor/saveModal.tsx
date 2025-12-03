import React, { FunctionComponent } from 'react';
import { GoAButton, GoAModal, GoAButtonGroup } from '@abgov/react-components';

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
    <GoAModal
      testId="save-form-modal"
      open={open}
      heading="You have unsaved changes"
      width="640px"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton testId="form-cancel-modal" type="tertiary" onClick={onCancel}>
            Cancel
          </GoAButton>
          <GoAButton type="secondary" testId="form-dont-save" onClick={() => onDontSave()}>
            Don't save
          </GoAButton>
          <GoAButton type="primary" testId="form-agree-save" disabled={saveDisable} onClick={() => onSave()}>
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      Leaving this page will discard any changes that haven't been saved
    </GoAModal>
  );
};
