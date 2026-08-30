import React, { useEffect } from 'react';
import { GoabButton, GoabModal, GoabButtonGroup } from '@abgov/react-components';
import { DeleteDialogContent } from './styled-components';

export interface DeleteDialogProps {
  open: boolean;
  onConfirm(): void;
  onCancel(): void;
  title: string;
  message: string;
}

export interface WithDeleteDialogSupport {
  openDeleteDialog(path: string, data: number, name?: string): void;
}
export interface WithBasicDeleteDialogSupport {
  openDeleteDialog(data: number, name?: string): void;
}

export const DeleteDialog = React.memo(function DeleteDialog({
  open,
  onConfirm,
  onCancel,
  title,
  message,
}: DeleteDialogProps) {
  useEffect(() => {
    if (open) {
      const deleteBtn = document.querySelector('[data-testId="object-array-confirm-button"]') as HTMLButtonElement;
      if (deleteBtn) {
        setTimeout(() => {
          deleteBtn.shadowRoot?.querySelector('button')?.focus();
        }, 200);
      }
    }
  }, [open]);

  return (
    <GoabModal open={open} key={1} testId="object-array-modal" heading={title}>
      <DeleteDialogContent data-testid="object-array-modal-content">{`${message}?`}</DeleteDialogContent>
      <GoabButtonGroup alignment="end">
        <GoabButton
          type="secondary"
          testId="object-array-modal-button"
          onClick={() => {
            onCancel();
          }}
        >
          Cancel
        </GoabButton>
        <GoabButton
          type="primary"
          variant="destructive"
          testId="object-array-confirm-button"
          onClick={() => {
            onConfirm();
          }}
        >
          Delete
        </GoabButton>
      </GoabButtonGroup>
    </GoabModal>
  );
});
