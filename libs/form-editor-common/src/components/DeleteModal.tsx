import React, { useEffect } from 'react';
import { GoAButton, GoAModal, GoAButtonGroup } from '@abgov/react-components';
import { PageIndicator } from './Indicator';
import { CenterPosition } from './styled-components';

interface deleteModalProps {
  title: string;
  content?: string | JSX.Element;
  isOpen: boolean;
  onDelete: () => void;
  onCancel: () => void;
  indicator: any;
}

export const DeleteModal = ({ isOpen, title, content, onDelete, onCancel, indicator }: deleteModalProps) => {
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
      {indicator && indicator.show && (
        <CenterPosition>
          <PageIndicator variant="fullscreen" indicator={indicator} />
        </CenterPosition>
      )}
      {content}
    </GoAModal>
  );
};
