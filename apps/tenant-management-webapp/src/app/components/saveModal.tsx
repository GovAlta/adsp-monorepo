import React, { FunctionComponent } from 'react';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalTitle } from '@abgov/react-components/experimental';
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
      <GoAModal testId="save-form-modal" isOpen={open}>
        <GoAModalTitle>You have unsaved changes</GoAModalTitle>
        <GoAModelTextWrapper>Leaving this page will discard any changes that haven't been saved</GoAModelTextWrapper>
        <GoAModalActions>
          <GoAButton data-testid="form-cancel-modal" buttonType="tertiary" type="button" onClick={onCancel}>
            Cancel
          </GoAButton>
          <GoAButton buttonType="secondary" data-testid="form-dont-save" type="submit" onClick={(e) => onDontSave()}>
            Don't save
          </GoAButton>
          <GoAButton
            buttonType="primary"
            data-testid="form-agree-save"
            type="submit"
            disabled={saveDisable}
            onClick={(e) => onSave()}
          >
            Save
          </GoAButton>
        </GoAModalActions>
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

const GoAModelTextWrapper = styled.div`
  padding: 0 1.5rem 0 1.75rem;
  max-width: 36rem;
`;
