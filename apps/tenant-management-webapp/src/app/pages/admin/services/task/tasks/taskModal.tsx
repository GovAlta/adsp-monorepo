import React, { FunctionComponent, useEffect, useState } from 'react';

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
} from '@abgov/react-components';

import { QueueTaskDefinition, defaultQueuedTask } from '@store/task/model';
import { badCharsCheck, wordMaxLengthCheck, isNotEmptyCheck, Validator } from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';

import { DescriptionItem, HelpText, ErrorMsg } from '../styled-components';
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

  useEffect(() => {
    setTask(initialValue);
  }, [initialValue, type]);

  const descErrMessage = 'Description can not be over 180 characters';

  const title = isNew ? 'Add task' : 'Edit task';
  const namespaceCheck = (): Validator => {
    return (namespace: string) => {
      return namespace === 'platform' ? 'Cannot use the word platform as namespace' : '';
    };
  };

  const { errors, validators } = useValidators(
    'name',
    'name',
    badCharsCheck,
    namespaceCheck(),
    wordMaxLengthCheck(32, 'Name'),
    isNotEmptyCheck('name')
  )
    .add('duplicated', 'name', isNotEmptyCheck('name'), wordMaxLengthCheck(180, 'Description'))
    .add('description', 'description', isNotEmptyCheck('name'), wordMaxLengthCheck(180, 'Description'))
    .add('priority', 'priority', isNotEmptyCheck('priority'))
    .build();

  const validationCheck = () => {
    const validations = {
      name: task?.name,
      description: task?.description,
      priority: task?.priority,
    };

    if (isNew) {
      validations['name'] = task?.name;
      validations['duplicated'] = task?.name;
      validations['description'] = task?.description;
      validations['priority'] = task?.priority;
    }
    if (!validators.checkAll(validations)) {
      return;
    }

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
              setTask(defaultQueuedTask);
              onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="task-modal-save"
            disabled={!task.name || !task.description || !task.priority || validators.haveErrors()}
            onClick={() => {
              validationCheck();
              setTask(defaultQueuedTask);
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
            testId={`task-modal-name-input`}
            width="100%"
            aria-label="name"
            onChange={(name, value) => {
              validators.remove('name');
              validators['name'].check(value);
              setTask({ ...task, name: value });
            }}
          />
        </GoAFormItem>

        <GoAFormItem label="Description">
          <DescriptionItem>
            <GoATextArea
              name="description"
              value={task?.description}
              width="100%"
              testId="description"
              aria-label="description"
              onKeyPress={(name, value, key) => {
                validators.remove('description');
                validators['description'].check(value);
                setTask({ ...task, description: value });
              }}
              // eslint-disable-next-line
              onChange={(name, value) => {}}
            />

            <HelpText>
              {task?.description?.length <= 180 ? (
                <div> {descErrMessage} </div>
              ) : (
                <ErrorMsg>
                  <GoAIcon type="warning" size="small" theme="filled" ariaLabel="warning" />
                  {`  ${errors?.['description']}`}
                </ErrorMsg>
              )}
              <div>{`${task?.description?.length}/180`}</div>
            </HelpText>
          </DescriptionItem>
        </GoAFormItem>
        <GoAFormItem label="Priority" error={errors?.['priority']}>
          <GoARadioGroup
            name="priority"
            value={task?.priority}
            onChange={(name, value) => {
              if (type === 'new') {
                validators.remove('priority');
                validators['priority'].check(value);
                setTask({ ...task, priority: value });
              }
            }}
            testId="task-modal-priority-radio-group"
            aria-label="task-modal-priority-radio"
          >
            <GoARadioItem name="priority" value="Normal" disabled={isNew} />
            <GoARadioItem name="priority" value="High" disabled={isNew} />
            <GoARadioItem name="priority" value="Urgent" disabled={isNew} />
          </GoARadioGroup>
        </GoAFormItem>
      </div>
    </GoAModal>
  );
};
