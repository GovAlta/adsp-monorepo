import { GoACallout, GoADetails, GoAButtonGroup, GoAButton } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { TASK_STATUS, TaskDetailsProps } from './types';

const PlaceholderDiv = styled.div`
  display: flex;
  flex-direction: column;

  > *:first-child {
    flex-grow: 1;
  }
`;

const Placeholder: FunctionComponent<TaskDetailsProps> = ({
  user,
  task,
  isExecuting,
  onClose,
  onStart,
  onComplete,
  onCancel,
}) => {
  return (
    <PlaceholderDiv>
      <div>
        <GoACallout type="information" heading="Task detail view">
          This is a placeholder for the task detail view. Replace with your own custom view for the specific type of
          task that users will work with.
        </GoACallout>
        <GoADetails ml="s" heading="Show task specific view">
          Replace this with a custom view so user can view and perform tasks. For example, if the task is to process a
          submission, show the form fields and attached files for the assessor.
        </GoADetails>
        <GoADetails ml="s" heading="Update task based on user actions">
          Tasks can be started, completed, and cancelled. Perform task lifecycle actions as part of the task specific
          user action. For example, if the task is to process a submission, the assessor's action to record a decision
          should complete the task.
        </GoADetails>
      </div>
      <GoAButtonGroup alignment="end" mt="l">
        <GoAButton type="secondary" onClick={onClose}>
          Close
        </GoAButton>
        {task?.status === TASK_STATUS.PENDING && (
          <GoAButton disabled={!user.isWorker || isExecuting} onClick={onStart}>
            Start task
          </GoAButton>
        )}
        {task?.status === TASK_STATUS.IN_PROGRESS && (
          <>
            <GoAButton type="secondary" disabled={!user.isWorker || isExecuting} onClick={() => onCancel(null)}>
              Cancel task
            </GoAButton>
            <GoAButton disabled={!user.isWorker || isExecuting} onClick={() => onComplete(null)}>
              Complete task
            </GoAButton>
          </>
        )}
      </GoAButtonGroup>
    </PlaceholderDiv>
  );
};

export default Placeholder;
