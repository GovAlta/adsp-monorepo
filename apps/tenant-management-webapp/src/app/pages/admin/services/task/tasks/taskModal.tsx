import React, { FunctionComponent, useEffect, useState } from 'react';

import {
  GoabButton,
  GoabButtonGroup,
  GoabFormItem,
  GoabInput,
  GoabModal,
  GoabRadioGroup,
  GoabRadioItem,
  GoabTextArea,
} from '@abgov/react-components';

import { QueueTaskDefinition, defaultQueuedTask } from '@store/task/model';
import { badCharsCheck, wordMaxLengthCheck, isNotEmptyCheck, Validator } from '@lib/validation/checkInput';
import { useValidators } from '@lib/validation/useValidators';

import { DescriptionItem } from '../styled-components';
import { HelpTextComponent } from '@components/HelpTextComponent';
import {
  GoabTextAreaOnKeyPressDetail,
  GoabInputOnChangeDetail,
  GoabRadioGroupOnChangeDetail,
} from '@abgov/ui-components-common';

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
    <GoabModal
      heading={title}
      testId="add-task-modal"
      open={open}
      actions={
        <GoabButtonGroup alignment="end">
          <GoabButton
            type="secondary"
            testId="task-modal-cancel"
            onClick={() => {
              validators.clear();
              setTask(defaultQueuedTask);
              onCancel();
            }}
          >
            Cancel
          </GoabButton>
          <GoabButton
            type="primary"
            testId="task-modal-save"
            disabled={!task.name || !task.description || !task.priority || validators.haveErrors()}
            onClick={() => {
              validationCheck();
              setTask(defaultQueuedTask);
            }}
          >
            Save
          </GoabButton>
        </GoabButtonGroup>
      }
    >
      <div>
        <GoabFormItem error={errors?.['name']} label="Name">
          <GoabInput
            type="text"
            name="name"
            value={task?.name}
            testId={`task-modal-name-input`}
            width="100%"
            aria-label="name"
            onChange={(detail: GoabInputOnChangeDetail) => {
              validators.remove('name');
              validators['name'].check(detail.value);
              setTask({ ...task, name: detail.value });
            }}
          />
        </GoabFormItem>

        <GoabFormItem label="Description">
          <DescriptionItem>
            <GoabTextArea
              name="description"
              value={task?.description}
              width="100%"
              testId="description"
              aria-label="description"
              onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
                validators.remove('description');
                validators['description'].check(detail.value);
                setTask({ ...task, description: detail.value });
              }}
              // eslint-disable-next-line
              onChange={() => {}}
            />
            <HelpTextComponent
              length={task?.description?.length || 0}
              maxLength={180}
              descErrMessage={descErrMessage}
              errorMsg={errors?.['description']}
            />
          </DescriptionItem>
        </GoabFormItem>
        <GoabFormItem label="Priority" error={errors?.['priority']}>
          <GoabRadioGroup
            name="priority"
            value={task?.priority}
            onChange={(detail: GoabRadioGroupOnChangeDetail) => {
              if (type === 'new') {
                validators.remove('priority');
                validators['priority'].check(detail.value);
                setTask({ ...task, priority: detail.value });
              }
            }}
            testId="task-modal-priority-radio-group"
            aria-label="task-modal-priority-radio"
          >
            <GoabRadioItem name="priority" value="Normal" disabled={isNew} />
            <GoabRadioItem name="priority" value="High" disabled={isNew} />
            <GoabRadioItem name="priority" value="Urgent" disabled={isNew} />
          </GoabRadioGroup>
        </GoabFormItem>
      </div>
    </GoabModal>
  );
};
