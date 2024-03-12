import React from 'react';
import { GoAButton, GoAModal, GoAButtonGroup } from '@abgov/react-components-new';
import { DeleteDialogContent } from './styled-components';

export interface DeleteDialogProps {
  open: boolean;
  onConfirm(): void;
  onCancel(): void;
  title: string;
  message: string;
}

export interface WithDeleteDialogSupport {
  openDeleteDialog(path: string, data: number): void;
}

export const DeleteDialog = React.memo(function DeleteDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
}: DeleteDialogProps) {
  return (
    <GoAModal open={open} key={1} testId="object-array-modal" heading={title}>
      <DeleteDialogContent data-testid="object-array-modal-content">{message}</DeleteDialogContent>
      <GoAButtonGroup alignment="end">
        <GoAButton
          type="secondary"
          testId="object-array-modal-button"
          onClick={() => {
            onCancel();
          }}
        >
          Cancel
        </GoAButton>
        <GoAButton
          type="primary"
          testId="object-array-confirm-button"
          onClick={() => {
            onConfirm();
          }}
        >
          Delete
        </GoAButton>
      </GoAButtonGroup>
    </GoAModal>
  );
});
