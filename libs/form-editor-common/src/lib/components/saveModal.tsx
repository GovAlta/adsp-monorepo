import React, { FunctionComponent } from 'react';
import { GoAButton, GoAModal, GoAButtonGroup } from '@abgov/react-components';
import styled from 'styled-components';

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
    <EditStyles>
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
    </EditStyles>
  );
};

const EditStyles = styled.div`
  ul {
    margin-left: 0;
  }

  li {
    border: 1px solid #f1f1f1;
  }

  .fitContent {
    max-width: fit-content;
    min-height: 146px;
  }

  .messages {
    margin-top: 0;
  }

  h3 {
    margin-bottom: 0;
  }
`;
