import React from 'react';
import { GoAButton, GoAModal, GoAButtonGroup } from '@abgov/react-components';
interface taskCancelModalProps {
  title: string;
  content?: string | JSX.Element;
  isOpen: boolean;
  onYes: () => void;
  onNo: () => void;
}

export const TaskCancelModal = ({ isOpen, title, content, onYes, onNo }: taskCancelModalProps) => {
  return (
    <GoAModal
      testId="cancel-task-confirmation"
      open={isOpen}
      heading={title}
      width="640px"
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton type="secondary" testId="task-cancelNo" onClick={onNo}>
            No
          </GoAButton>
          <GoAButton type="primary" variant="destructive" testId="task-confirmYes" onClick={onYes}>
            Yes
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      {content}
    </GoAModal>
  );
};
