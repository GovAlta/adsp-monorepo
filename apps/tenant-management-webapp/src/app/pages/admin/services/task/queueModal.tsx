import React, { FunctionComponent, useState } from 'react';
import { GoAModal, GoAModalActions, GoAModalContent, GoAModalTitle } from '@abgov/react-components/experimental';
import { GoAButton, GoAButtonGroup } from '@abgov/react-components-new';
import { GoAForm, GoAFormItem, GoAInput } from '@abgov/react-components/experimental';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router';
import { useHistory } from 'react-router-dom';
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
  const { url } = useRouteMatch();
  const history = useHistory();

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

    history.push({ pathname: `${url}/edit/${queue.namespace}:${queue.name}`, state: queue });
    onCancel();
    validators.clear();
  };

  return (
    <GoAModal testId="add-queue-modal" isOpen={open}>
      <GoAModalTitle>{title}</GoAModalTitle>
      <GoAModalContent>
        <GoAForm>
          <GoAFormItem error={errors?.['namespace']}>
            <label>Namespace</label>
            <GoAInput
              type="text"
              name="namespace"
              value={queue.namespace}
              data-testid={`queue-modal-namesppace-input`}
              aria-label="namespace"
              disabled={!isNew}
              onChange={(namespace, value) => {
                const validations = {
                  namespace: value,
                };
                validators.remove('namespace');
                if (isNew) {
                  validations['namespace'] = value;
                }
                validators.checkAll(validations);
                value = toKebabName(value);
                setQueue({ ...queue, namespace: value });
              }}
            />
          </GoAFormItem>
          <GoAFormItem error={errors?.['name']}>
            <label>Name</label>
            <GoAInput
              type="text"
              name="name"
              value={queue.name}
              data-testid={`queue-modal-name-input`}
              aria-label="name"
              disabled={!isNew}
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
                setQueue({ ...queue, name: value });
              }}
            />
          </GoAFormItem>
        </GoAForm>
      </GoAModalContent>
      <GoAModalActions>
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
      </GoAModalActions>
    </GoAModal>
  );
};
