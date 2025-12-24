import React from 'react';
import { GoabButton, GoabModal, GoabButtonGroup } from '@abgov/react-components';
interface taskCancelModalProps {
  title: string;
  content?: string | JSX.Element;
  isOpen: boolean;
  onYes: () => void;
  onNo: () => void;
}

export const TaskCancelModal = ({ isOpen, title, content, onYes, onNo }: taskCancelModalProps) => {
  return (
    <GoabModal
      testId="cancel-task-confirmation"
      open={isOpen}
      heading={title}
      maxWidth="640px"
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton type="secondary" testId="task-cancelNo" onClick={onNo}>
            No
          </GoabButton>
          <GoabButton type="primary" variant="destructive" testId="task-confirmYes" onClick={onYes}>
            Yes
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      {content}
    </GoabModal>
  );
};
