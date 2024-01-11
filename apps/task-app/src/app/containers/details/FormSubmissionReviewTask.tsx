import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { TaskDetailsProps } from './types';
import { registerDetailsComponent } from './register';

const FormSubmissionReviewTaskComponent: FunctionComponent<TaskDetailsProps> = ({
  className,
  user,
  task,
  isExecuting,
}) => {
  return <div className={className}></div>;
};

const FormSubmissionReviewTask = styled(FormSubmissionReviewTaskComponent)``;

registerDetailsComponent(
  (task) => task?.recordId.startsWith('urn:ads:platform:file-service:v1:/forms/'),
  FormSubmissionReviewTask
);
