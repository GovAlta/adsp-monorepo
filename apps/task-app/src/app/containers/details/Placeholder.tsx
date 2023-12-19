import { GoACallout, GoADetails, GoAButtonGroup, GoAButton } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { taskActions, startTask, cancelTask, completeTask, AppDispatch } from '../../state';
import { TaskDetailsProps } from './types';

const Placeholder: FunctionComponent<TaskDetailsProps> = ({ className, user, task, isExecuting }) => {
  const dispatch = useDispatch<AppDispatch>();
  return (
    <div className={className}>
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
        <GoAButton type="secondary" onClick={() => dispatch(taskActions.setOpenTask())}>
          Close
        </GoAButton>
        {task?.status === 'Pending' && (
          <GoAButton disabled={!user.isWorker || isExecuting} onClick={() => dispatch(startTask({ taskId: task?.id }))}>
            Start task
          </GoAButton>
        )}
        {task?.status === 'In Progress' && (
          <>
            <GoAButton
              type="secondary"
              disabled={!user.isWorker || isExecuting}
              onClick={() => dispatch(cancelTask({ taskId: task?.id, reason: null }))}
            >
              Cancel task
            </GoAButton>
            <GoAButton
              disabled={!user.isWorker || isExecuting}
              onClick={() => dispatch(completeTask({ taskId: task?.id }))}
            >
              Complete task
            </GoAButton>
          </>
        )}
      </GoAButtonGroup>
    </div>
  );
};

export default styled(Placeholder)`
  display: flex;
  flex-direction: column;

  > *:first-child {
    flex-grow: 1;
  }
`;
