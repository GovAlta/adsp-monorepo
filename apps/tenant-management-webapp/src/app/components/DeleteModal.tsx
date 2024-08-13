import React, { useEffect, useState } from 'react';
import { GoAButton, GoAModal, GoAButtonGroup } from '@abgov/react-components-new';
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
          <PageIndicator variant="fullscreen" />
        </CenterPosition>
      )}
      {content}
    </GoAModal>
  );
};
