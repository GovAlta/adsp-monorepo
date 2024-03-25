import React from 'react';
import { GoAButton, GoAModal, GoAButtonGroup } from '@abgov/react-components-new';
interface deleteFileModalProps {
  title: string;
  content?: string | JSX.Element;
  isOpen: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

export const DeleteFileModal = ({ isOpen, title, content, onDelete, onCancel }: deleteFileModalProps) => {
  return (
    <GoAModal
      testId="delete-confirmation"
      open={isOpen}
      heading={title}
      width="640px"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton type="secondary" testId="delete-cancel" onClick={onCancel}>
            Cancel
          </GoAButton>
          <GoAButton type="primary" variant="destructive" testId="delete-confirm" onClick={onDelete}>
            Delete
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      {content}
    </GoAModal>
  );
};
