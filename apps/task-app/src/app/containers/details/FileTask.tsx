import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { AppDispatch, completeTask } from '../../state';
import FileViewer from '../FileViewer';
import { TaskDetailsProps } from './types';
import { registerDetailsComponent } from './register';

const FileTaskComponent: FunctionComponent<TaskDetailsProps> = ({ className, user, task, isExecuting, onClose }) => {
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

const FileTask = styled(FileTaskComponent)`
  display: flex;
  flex-direction: column;
  & > :first-child {
    flex: 1;
  }
  & > :last-child {
    flex: 0;
  }
`;

registerDetailsComponent((task) => task?.recordId.startsWith('urn:ads:platform:file-service:v1:/files/'), FileTask);
