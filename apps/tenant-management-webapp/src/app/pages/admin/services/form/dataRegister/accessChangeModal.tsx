import * as React from 'react';
import { GoabButton, GoabButtonGroup, GoabModal } from '@abgov/react-components';

interface AccessChangeModalProps {
  open: boolean;
  name: string;
  // The access the register will have once the change is confirmed.
  anonymousRead: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AccessChangeModal = ({
  open,
  name,
  anonymousRead,
  onConfirm,
  onCancel,
}: AccessChangeModalProps): JSX.Element => (
  <GoabModal
    testId="data-register-access-modal"
    open={open}
    heading={anonymousRead ? 'Allow anonymous access' : 'Make register private'}
    maxWidth="640px"
    onClose={onCancel}
    actions={
      <GoabButtonGroup alignment="end">
        <GoabButton size="compact" type="secondary" testId="data-register-access-cancel" onClick={onCancel}>
          Cancel
        </GoabButton>
        <GoabButton size="compact" type="primary" testId="data-register-access-confirm" onClick={onConfirm}>
          {anonymousRead ? 'Allow anonymous access' : 'Make private'}
        </GoabButton>
      </GoabButtonGroup>
    }
  >
    {anonymousRead ? (
      <p>
        Anyone who knows your tenant and the name <b>{name}</b> will be able to read its entries without signing in,
        including anonymous applicants and other apps. Don't allow this if the entries are sensitive.
      </p>
    ) : (
      <p>
        Only signed-in users of this tenant will be able to read <b>{name}</b>. Forms that allow anonymous applicants,
        and other apps that read it without signing in, will lose its options.
      </p>
    )}
  </GoabModal>
);
