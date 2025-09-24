import { GoAButton, GoAButtonGroup } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import { useDispatch } from 'react-redux';
import { TaskDetailsLayout } from '../../components/TaskDetailsLayout';
import { AppDispatch, completeTask } from '../../state';
import FileViewer from '../FileViewer';
import { TaskDetailsProps } from './types';
import { registerDetailsComponent } from './register';

const FileTask: FunctionComponent<TaskDetailsProps> = ({ user, task, isExecuting, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <TaskDetailsLayout>
      <FileViewer urn={task.recordId} />
      <GoAButtonGroup alignment="end" mt="l">
        <GoAButton type="secondary" onClick={onClose}>
          Close
        </GoAButton>
        <GoAButton disabled={!user.isWorker || isExecuting} onClick={() => dispatch(completeTask({ taskId: task.id }))}>
          Complete task
        </GoAButton>
      </GoAButtonGroup>
    </TaskDetailsLayout>
  );
};

registerDetailsComponent((task) => task?.recordId.startsWith('urn:ads:platform:file-service:v1:/files/'), FileTask);
