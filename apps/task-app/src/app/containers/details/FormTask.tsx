import { GoARenderers } from '@abgov/jsonforms-components';
import { GoabButton, GoabButtonGroup, GoabSkeleton } from '@abgov/react-components';
import { AdspId } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TaskDetailsLayout } from '../../components/TaskDetailsLayout';
import { AppDispatch, AppState, formDefinitionSelector, loadDefinition, updateTaskData } from '../../state';
import { TASK_STATUS, TaskDetailsProps } from './types';
import { registerDetailsComponent } from './register';

interface TaskFormProps {
  readonly: boolean;
  definitionId: string;
  data: Record<string, unknown>;
  onChangeData: (data: Record<string, unknown>) => void;
  onChangeErrors: (errors: unknown[]) => void;
}

const TaskForm: FunctionComponent<TaskFormProps> = ({ readonly, definitionId, data, onChangeData, onChangeErrors }) => {
  const dispatch = useDispatch<AppDispatch>();
  const definition = useSelector((state: AppState) => formDefinitionSelector(state, definitionId));

  useEffect(() => {
    if (definitionId) {
      dispatch(loadDefinition(definitionId));
    }
  }, [dispatch, definitionId]);

  return definition ? (
    <JsonForms
      readonly={readonly}
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
        onChangeErrors(errors);
      }}
    />
  ) : (
    <GoabSkeleton type="card" />
  );
};

const FormTask: FunctionComponent<TaskDetailsProps> = ({ user, task, isExecuting, onClose, onComplete }) => {
  const dispatch = useDispatch<AppDispatch>();
  const adspId = AdspId.parse(task.recordId);
  const [_api, _config, _formService, definitionId] = adspId.resource.split('/');

  useEffect(() => {
    dispatch(loadDefinition(definitionId));
  }, [dispatch, definitionId]);

  const [data, setData] = useState(task.data);
  const [hasErrors, setHasErrors] = useState(false);

  return (
    <TaskDetailsLayout>
      <TaskForm
        key={definitionId}
        definitionId={definitionId}
        readonly={task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.CANCELLED}
        data={data}
        onChangeData={setData}
        onChangeErrors={(errors) => setHasErrors(errors.length > 0)}
      />
      <GoabButtonGroup alignment="end" mt="l">
        <GoabButton
          mr="l"
          type={
            task.status === TASK_STATUS.PENDING || task.status === TASK_STATUS.IN_PROGRESS ? 'tertiary' : 'secondary'
          }
          onClick={onClose}
        >
          Close
        </GoabButton>
        <GoabButton
          type="secondary"
          disabled={
            !user.isWorker ||
            isExecuting ||
            task.status === TASK_STATUS.COMPLETED ||
            task.status === TASK_STATUS.CANCELLED
          }
          onClick={() => dispatch(updateTaskData({ taskId: task.id, data }))}
        >
          Save
        </GoabButton>
        <GoabButton
          disabled={!user.isWorker || isExecuting || task.status !== TASK_STATUS.IN_PROGRESS || hasErrors}
          onClick={async () => {
            await dispatch(updateTaskData({ taskId: task.id, data }));
            onComplete();
          }}
        >
          Complete task
        </GoabButton>
      </GoabButtonGroup>
    </TaskDetailsLayout>
  );
};

registerDetailsComponent(
  (task) => task?.recordId.startsWith('urn:ads:platform:configuration-service:v2:/configuration/form-service/'),
  FormTask
);
