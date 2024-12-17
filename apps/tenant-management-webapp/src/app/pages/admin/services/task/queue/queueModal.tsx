import React, { FunctionComponent, useState } from 'react';

import { GoAButton, GoAButtonGroup, GoAFormItem, GoAInput, GoAModal } from '@abgov/react-components-new';

import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { TaskDefinition } from '@store/task/model';
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
interface QueueModalProps {
  initialValue?: TaskDefinition;
  type: string;
  onCancel?: () => void;
  onSave: (queue: TaskDefinition) => void;
  open: boolean;
}

export const QueueModal: FunctionComponent<QueueModalProps> = ({
  initialValue,
  type,
  onCancel,
  onSave,
  open,
}: QueueModalProps): JSX.Element => {
  const isNew = type === 'new';
  const navigate = useNavigate();

  const [queue, setQueue] = useState<TaskDefinition>(initialValue);

  const queues = useSelector((state: RootState) => {
    return state?.task?.queues;
  });
  const queueNames = queues ? Object.keys(queues) : [];
  const title = isNew ? 'Add queue' : 'Edit queue';
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
    .add('duplicated', 'name', isNotEmptyCheck('name'), duplicateNameCheck(queueNames, 'Queue'))
    .add(
      'namespace',
      'namespace',
      isNotEmptyCheck('namespace'),
      wordMaxLengthCheck(32, 'Namespace'),
      duplicateNameCheck(queueNames, 'Queue')
    )
    .build();
  const validationCheck = () => {
    const validations = {
      name: queue.name,
      namespace: queue.namespace,
    };

    if (isNew) {
      validations['duplicated'] = `${queue?.namespace}:${queue?.name}`;

      if (!validators.checkAll(validations)) {
        return;
      }
    }
    onSave(queue);

    navigate(`edit/${queue.namespace}:${queue.name}`, { state: queue });
    onCancel();
    validators.clear();
  };

  return (
    <GoAModal
      testId="add-queue-modal"
      open={open}
      heading={title}
      actions={
        <GoAButtonGroup alignment="end">
          <GoAButton
            type="secondary"
            testId="queue-modal-cancel"
            onClick={() => {
              validators.clear();
              onCancel();
            }}
          >
            Cancel
          </GoAButton>
          <GoAButton
            type="primary"
            testId="queue-modal-save"
            disabled={!queue.name || validators.haveErrors()}
            onClick={() => {
              validationCheck();
            }}
          >
            Save
          </GoAButton>
        </GoAButtonGroup>
      }
    >
      <GoAFormItem error={errors?.['namespace']} label="Namespace">
        <GoAInput
          type="text"
          name="namespace"
          value={queue.namespace}
          width="100%"
          data-testid={`queue-modal-namespace-input`}
          aria-label="namespace"
          disabled={!isNew}
          onChange={(namespace, value) => {
            const validations = { namespace: value };
            validators.remove('namespace');
            validators.remove('name');
            if (isNew) {
              validations['namespace'] = value;
            }
            validators.checkAll(validations);

            setQueue({ ...queue, namespace: value });
          }}
          onBlur={() => {
            validators.checkAll({ namespace: queue.namespace });
          }}
        />
      </GoAFormItem>
      <GoAFormItem error={errors?.['name']} label="Name">
        <GoAInput
          type="text"
          name="name"
          width="100%"
          value={queue.name}
          data-testid={`queue-modal-name-input`}
          aria-label="name"
          disabled={!isNew}
          onChange={(name, value) => {
            const validations = { name: value };
            validators.remove('name');
            if (isNew) {
              validations['duplicated'] = value;
            }
            validators.checkAll(validations);

            setQueue({ ...queue, name: value });
          }}
          onBlur={() => {
            validators.checkAll({ name: queue.name });
          }}
        />
      </GoAFormItem>
    </GoAModal>
  );
};
