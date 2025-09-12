import { GoARenderers } from '@abgov/jsonforms-components';
import { GoAButton, GoAButtonGroup } from '@abgov/react-components';
import { AdspId } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  AppDispatch,
  AppState,
  completeTask,
  formDefinitionSelector,
  loadDefinition,
  Task,
  updateTaskData,
} from '../../state';
import { TASK_STATUS, TaskDetailsProps } from './types';
import { registerDetailsComponent } from './register';

const FormTaskDiv = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: var(--goa-space-l);
  & > :first-child {
    flex: 1;
  }
  & > :last-child {
    flex: 0;
  }
`;

interface TaskFormProps {
  definitionId: string;
  data: Record<string, unknown>;
  onChangeData: (data: Record<string, unknown>) => void;
}
const TaskForm: FunctionComponent<TaskFormProps> = ({ definitionId, data, onChangeData }) => {
  const dispatch = useDispatch<AppDispatch>();
  const definition = useSelector((state: AppState) => formDefinitionSelector(state, definitionId));

  useEffect(() => {
    if (definitionId) {
      dispatch(loadDefinition(definitionId));
    }
  }, [dispatch, definitionId]);

  return definition ? (
    <JsonForms
      schema={definition.dataSchema}
      uischema={definition.uiSchema}
      data={data}
      validationMode="ValidateAndShow"
      renderers={GoARenderers}
      onChange={({ errors, data }) => {
        // Only update the data if there are no validation errors.
        if (errors.length === 0) {
          onChangeData(data);
        }
      }}
    />
  ) : (
    <div>Loading form definition...</div>
  );
};

const FormTask: FunctionComponent<TaskDetailsProps> = ({ user, task, isExecuting, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const adspId = AdspId.parse(task.recordId);
  const [_api, _config, _formService, definitionId] = adspId.resource.split('/');

  useEffect(() => {
    dispatch(loadDefinition(definitionId));
  }, [dispatch, definitionId]);

  const [data, setData] = useState(task.data);

  return (
    <FormTaskDiv>
      <TaskForm key={definitionId} definitionId={definitionId} data={data} onChangeData={setData} />
      <GoAButtonGroup alignment="end" mt="xl">
        <GoAButton
          mr="l"
          type={
            task.status === TASK_STATUS.PENDING || task.status === TASK_STATUS.IN_PROGRESS ? 'tertiary' : 'secondary'
          }
          onClick={onClose}
        >
          Close
        </GoAButton>
        <GoAButton
          type="secondary"
          disabled={!user.isWorker || isExecuting}
          onClick={() => dispatch(updateTaskData({ taskId: task.id, data }))}
        >
          Save
        </GoAButton>
        <GoAButton
          disabled={!user.isWorker || isExecuting || task.status !== TASK_STATUS.IN_PROGRESS}
          onClick={() => dispatch(completeTask({ taskId: task.id }))}
        >
          Complete task
        </GoAButton>
      </GoAButtonGroup>
    </FormTaskDiv>
  );
};

registerDetailsComponent(
  (task) => task?.recordId.startsWith('urn:ads:platform:configuration-service:v2:/configuration/form-service/'),
  FormTask
);
