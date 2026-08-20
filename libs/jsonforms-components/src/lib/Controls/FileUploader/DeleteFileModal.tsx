import React from 'react';
import { GoabButton, GoabModal, GoabButtonGroup } from '@abgov/react-components';
interface deleteModalProps {
  title: string;
  content?: string | JSX.Element;
  isOpen: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

export const DeleteFileModal = ({ isOpen, title, content, onDelete, onCancel }: deleteModalProps) => {
  return (
    <GoabModal
      testId="delete-confirmation"
      open={isOpen}
      heading={title}
      maxWidth="640px"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton type="secondary" testId="delete-cancel" onClick={onCancel}>
            Cancel
          </GoabButton>
          <GoabButton type="primary" variant="destructive" testId="delete-confirm" onClick={onDelete}>
            Delete
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      {content}
    </GoabModal>
  );
};
