import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { AppDispatch, completeTask } from '../../state';
import FileViewer from '../FileViewer';
import { TaskDetailsProps } from './types';

const FileTask: FunctionComponent<TaskDetailsProps> = ({ className, user, task, isExecuting, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className={className}>
      <FileViewer urn={task.recordId} />
      <GoAButtonGroup alignment="end" mt="l">
        <GoAButton type="secondary" onClick={onClose}>
          Close
        </GoAButton>
        <GoAButton disabled={!user.isWorker || isExecuting} onClick={() => dispatch(completeTask({ taskId: task.id }))}>
          Complete task
        </GoAButton>
      </GoAButtonGroup>
    </div>
  );
};

export default styled(FileTask)`
  display: flex;
  flex-direction: column;
  & > :first-child {
    flex: 1;
  }
  & > :last-child {
    flex: 0;
  }
`;
