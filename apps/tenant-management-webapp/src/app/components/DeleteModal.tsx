import React, { FunctionComponent } from 'react';
import { GoAButton } from '@abgov/react-components';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';

interface deleteModalProps {
  title: string;
  content?: string;
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
        <GoAButton buttonType="tertiary" data-testid="delete-cancel" onClick={onCancel}>
          Cancel
        </GoAButton>
        <GoAButton buttonType="primary" data-testid="delete-confirm" onClick={onDelete}>
          Delete
        </GoAButton>
      </GoAModalActions>
    </GoAModal>
  );
};
