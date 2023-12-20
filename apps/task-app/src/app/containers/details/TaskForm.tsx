import { FunctionComponent } from 'react';
import { TaskDetailsProps } from './types';
import styled from 'styled-components';

const TaskForm: FunctionComponent<TaskDetailsProps> = ({ className, user, task, isExecuting }) => {
  return <div className={className}></div>;
};

export default styled(TaskForm)``;
