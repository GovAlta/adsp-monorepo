import React, { FunctionComponent } from 'react';
import type { NotificationItem } from '@store/notification/models';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalTitle } from '@abgov/react-components/experimental';
import styled from 'styled-components';

interface NotificationTypeFormProps {
  onCancel?: () => void;
  onSave?: () => void;
  onDontSave?: () => void;
  open: boolean;
}

export const SaveFormModal: FunctionComponent<NotificationTypeFormProps> = ({ onCancel, onDontSave, onSave, open }) => {
  return (
    <EditStyles>
      <GoAModal testId="notification-types-save-form" isOpen={open}>
        <GoAModalTitle>You have unsaved changes</GoAModalTitle>
        <GoAModelTextWrapper>Leaving this page will discard any changes that haven't been saved</GoAModelTextWrapper>
        <GoAModalActions>
          <GoAButton data-testid="form-cancel-modal" buttonType="tertiary" type="button" onClick={onCancel}>
            Cancel
          </GoAButton>
          <GoAButton buttonType="tertiary" data-testid="form-dont-save" type="submit" onClick={(e) => onDontSave()}>
            Don't save
          </GoAButton>
          <GoAButton buttonType="primary" data-testid="form-agree-save" type="submit" onClick={(e) => onSave()}>
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
