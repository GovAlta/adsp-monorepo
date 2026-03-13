import * as React from 'react';
import { GoabButton, GoabButtonGroup, GoabFormItem, GoabInput, GoabModal, GoabTextArea } from '@abgov/react-components';
import { GoabInputOnChangeDetail, GoabTextAreaOnKeyPressDetail } from '@abgov/ui-components-common';

interface AddRegisterDataModalProps {
  open: boolean;
  newName: string;
  newDescription: string;
  newData: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onDataChange: (value: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export const AddRegisterDataModal = ({
  open,
  newName,
  newDescription,
  newData,
  onNameChange,
  onDescriptionChange,
  onDataChange,
  onCancel,
  onSave,
}: AddRegisterDataModalProps): JSX.Element => {
  return (
    <GoabModal
      heading="Add register data"
      open={open}
      testId="data-register-add-modal"
      maxWidth="500px"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton type="secondary" onClick={onCancel} testId="data-register-add-cancel">
            Cancel
          </GoabButton>
          <GoabButton type="primary" onClick={onSave} disabled={!newName.trim()} testId="data-register-add-save">
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <GoabFormItem label="Name">
        <GoabInput
          width="100%"
          name="register-name"
          value={newName}
          onChange={(detail: GoabInputOnChangeDetail) => onNameChange(detail.value)}
          testId="data-register-add-name-input"
          mb="l"
        />
      </GoabFormItem>
      <GoabFormItem label="Description">
        <GoabTextArea
          name="register-description"
          value={newDescription}
          width="100%"
          testId="data-register-add-description-input"
          onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => onDescriptionChange(detail.value)}
        />
      </GoabFormItem>
      <GoabFormItem label="Register data">
        <GoabTextArea
          name="register-data"
          value={newData}
          width="100%"
          testId="data-register-add-data-input"
          onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => onDataChange(detail.value)}
        />
      </GoabFormItem>
    </GoabModal>
  );
};
