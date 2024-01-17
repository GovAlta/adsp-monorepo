import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { TaskDetailsProps } from './types';
import { registerDetailsComponent } from './register';

const FormSubmissionReviewTask: FunctionComponent<TaskDetailsProps> = ({ user, task, isExecuting }) => {
  return <div></div>;
};

registerDetailsComponent(
  (task) => task?.recordId.startsWith('urn:ads:platform:file-service:v1:/forms/'),
  FormSubmissionReviewTask
);
