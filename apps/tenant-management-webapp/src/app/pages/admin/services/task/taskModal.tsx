import React, { FunctionComponent, useState } from 'react';

import {
  GoAButton,
  GoAButtonGroup,
  GoAFormItem,
  GoAIcon,
  GoAInput,
  GoAModal,
  GoARadioGroup,
  GoARadioItem,
  GoATextArea,
} from '@abgov/react-components-new';
import { useSelector } from 'react-redux';
import { QueueTaskDefinition } from '@store/task/model';
import {
  badCharsCheck,
  wordMaxLengthCheck,
  isNotEmptyCheck,
  duplicateNameCheck,
  Validator,
} from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';
import { RootState } from '@store/index';
import { toKebabName } from '@lib/kebabName';
import { DescriptionItem, HelpText, ErrorMsg } from './styled-components';
interface TaskModalProps {
  initialValue?: QueueTaskDefinition;
  type: string;
  queue: string;
  onCancel?: () => void;
  onSave: (task: QueueTaskDefinition) => void;
  open: boolean;
}

export const TaskModal: FunctionComponent<TaskModalProps> = ({
  initialValue,
  type,
  onCancel,
  onSave,
  open,
  queue,
}: TaskModalProps): JSX.Element => {
  const isNew = type === 'new';

  const [task, setTask] = useState<QueueTaskDefinition>(initialValue);

  const tasks = useSelector((state: RootState) => {
    return state?.task?.tasks;
  });
  const descErrMessage = 'Description can not be over 180 characters';
  const taskNames = tasks ? Object.keys(tasks) : [];
  const title = isNew ? 'Add Task' : 'Edit Task';
  const namespaceCheck = (): Validator => {
    return (namespace: string) => {
      return namespace === 'platform' ? 'Cannot use the word platform as namespace' : '';
    };
  };
  const [priority, setPriority] = useState<string>('');
  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    namespaceCheck(),
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicated', 'name', duplicateNameCheck(taskNames, 'Task'))
    .add('description', 'description', wordMaxLengthCheck(180, 'Description'))
    .add(
      'namespace',
      'namespace',
      isNotEmptyCheck('namespace'),
      wordMaxLengthCheck(32, 'Namespace'),
      duplicateNameCheck(taskNames, 'Task')
    )
    .build();
  const validationCheck = () => {
    const validations = {
      name: task?.name,
    };

    if (isNew) {
      validations['duplicated'] = task?.name;

      if (!validators.checkAll(validations)) {
        return;
      }
    }
    task.priority = priority;
    task.recordId = queue;
    onSave(task);

    onCancel();
    validators.clear();
  };

  return (
    <GoAModal
      heading={title}
      testId="add-task-modal"
      open={open}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="task-modal-cancel"
            onClick={() => {
              validators.clear();
              onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="task-modal-save"
            disabled={!task?.name || validators.haveErrors()}
            onClick={() => {
              validationCheck();
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <div>
        <GoAFormItem error={errors?.['name']} label="Name">
          <GoAInput
            type="text"
            name="name"
            value={task?.name}
            data-testid={`task-modal-name-input`}
            aria-label="name"
            onChange={(name, value) => {
              const validations = {
                name: value,
              };
              validators.remove('name');
              if (isNew) {
                validations['duplicated'] = value;
              }
              validators.checkAll(validations);
              value = toKebabName(value);
              setTask({ ...task, name: value });
            }}
          />
        </GoAFormItem>

        <GoAFormItem label="Description">
          <DescriptionItem>
            <GoATextArea
              name="form-task-description"
              value={task?.description}
              width="100%"
              testId="form-task-description"
              aria-label="form-task-description"
              onChange={(name, value) => {
                validators.remove('description');
                validators['description'].check(value);
                setTask({ ...task, description: value });
              }}
            />

            <HelpText>
              {task?.description?.length <= 180 ? (
                <div> {descErrMessage} </div>
              ) : (
                <ErrorMsg>
                  <GoAIcon type="warning" size="small" theme="filled" />
                  {`  ${errors?.['description']}`}
                </ErrorMsg>
              )}
              <div>{`${task?.description?.length}/180`}</div>
            </HelpText>
          </DescriptionItem>
        </GoAFormItem>
        <GoAFormItem label="Priority">
          <GoARadioGroup
            name="color"
            value={task?.priority}
            onChange={(_name, value) => setPriority(value)}
            disabled={!isNew}
          >
            <GoARadioItem name="priority" value="Normal" />
            <GoARadioItem name="priority" value="High" />
            <GoARadioItem name="priority" value="Urgent" />
          </GoARadioGroup>
        </GoAFormItem>
      </div>
    </GoAModal>
  );
};
