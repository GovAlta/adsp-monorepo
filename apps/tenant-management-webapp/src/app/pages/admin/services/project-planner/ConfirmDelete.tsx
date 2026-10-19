import React, { FunctionComponent, ReactNode } from 'react';
import { GoabButton, GoabButtonGroup, GoabModal } from '@abgov/react-components';

interface ConfirmDeleteProps {
  open: boolean;
  heading: string;
  confirmLabel?: string;
  busy?: boolean;
  /** Buttons get `${testIdPrefix}-cancel` and `${testIdPrefix}-confirm`; the modal defaults to `${testIdPrefix}-modal`. */
  testIdPrefix: string;
  modalTestId?: string;
  onCancel: () => void;
  onConfirm: () => void;
  children: ReactNode;
}

export const ConfirmDelete: FunctionComponent<ConfirmDeleteProps> = ({
  open,
  heading,
  confirmLabel = 'Delete',
  busy = false,
  testIdPrefix,
  modalTestId = `${testIdPrefix}-modal`,
  onCancel,
  onConfirm,
  children,
}) => (
  <GoabModal
    open={open}
    testId={modalTestId}
    heading={heading}
    calloutVariant="emergency"
    onClose={onCancel}
    actions={
      <GoabButtonGroup alignment="end" mt="m">
        <GoabButton
          size="compact"
          type="secondary"
          disabled={busy}
          testId={`${testIdPrefix}-cancel`}
          onClick={onCancel}
        >
          Cancel
        </GoabButton>
        <GoabButton
          size="compact"
          variant="destructive"
          disabled={busy}
          testId={`${testIdPrefix}-confirm`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </GoabButton>
      </GoabButtonGroup>
    }
  >
    {children}
  </GoabModal>
);

export default ConfirmDelete;
