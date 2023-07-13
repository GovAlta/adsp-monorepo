import React, { FunctionComponent } from 'react';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { ActionButtonWrapper } from './styled-components';
interface deleteModalProps {
  title: string;
  content?: string | JSX.Element;
  isOpen: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

export const DeleteModal: FunctionComponent<deleteModalProps> = ({ isOpen, title, content, onDelete, onCancel }) => {
  return (
    <GoAModal testId="delete-confirmation" isOpen={isOpen}>
      <GoAModalTitle>{title}</GoAModalTitle>
      <GoAModalContent>{content}</GoAModalContent>
      <GoAModalActions>
        <ActionButtonWrapper>
          <GoAButton buttonType="secondary" data-testid="delete-cancel" onClick={onCancel}>
            Cancel
          </GoAButton>
          <GoAButton buttonType="primary" variant="destructive" data-testid="delete-confirm" onClick={onDelete}>
            Delete
          </GoAButton>
        </ActionButtonWrapper>
      </GoAModalActions>
    </GoAModal>
  );
};
