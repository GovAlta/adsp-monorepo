import React, { useEffect } from 'react';
import { GoabButton, GoabModal, GoabButtonGroup } from '@abgov/react-components';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';
import { PageIndicator } from './Indicator';
import { CenterPosition } from './styled-components';

interface deleteModalProps {
  title: string;
  content?: string | JSX.Element;
  isOpen: boolean;
  onDelete: () => void;
  onCancel: () => void;
}

export const DeleteModal = ({ isOpen, title, content, onDelete, onCancel }: deleteModalProps) => {
  const indicator = useSelector((state: RootState) => {
    return state?.session?.indicator;
  });

  useEffect(() => {
    if (isOpen) {
      const deletBtn = document.querySelector('[data-testId="delete-confirm"]') as HTMLButtonElement;
      if (deletBtn) {
        setTimeout(() => {
          deletBtn.shadowRoot.querySelector('button').focus();
        }, 0);
      }
    }
  }, [isOpen]);

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
      {indicator && indicator.show && (
        <CenterPosition>
          <PageIndicator variant="fullscreen" />
        </CenterPosition>
      )}
      {content}
    </GoabModal>
  );
};
