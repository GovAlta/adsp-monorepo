import { GoAReviewRenderers } from '@abgov/jsonforms-components';
import {
  GoAButtonGroup,
  GoAButton,
  GoAFormItem,
  GoADropdown,
  GoADropdownItem,
  GoATextArea,
} from '@abgov/react-components';
import { AdspId } from '@core-services/app-common';
import { JsonForms } from '@jsonforms/react';
import React, { FunctionComponent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useValidators } from '../../../lib/validations/useValidators';
import { isNotEmptyCheck } from '../../../lib/validations/checkInput';
import { TaskDetailsLayout } from '../../components/TaskDetailsLayout';
import { AppDispatch, formSelector, selectForm } from '../../state';
import { TASK_STATUS, TaskDetailsProps } from './types';
import { registerDetailsComponent } from './register';

import { ReviewContent, ActionContainer, FormReviewContainer } from './styled-components';
import { TaskCancelModal } from './TaskCancelModal';

export const FormSubmissionReviewTask: FunctionComponent<TaskDetailsProps> = ({
  user,
  task,
  isExecuting,
  onClose,
  onStart,
  onComplete,
  onCancel,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const form = useSelector(formSelector);
  const adspId = AdspId.parse(task.recordId);
  const [_, _type, id, _submission, submissionId] = adspId.resource.split('/');

  useEffect(() => {
    dispatch(selectForm({ formId: id, submissionId: submissionId }));
  }, [dispatch, id, submissionId]);

  const NO_DISPOSITION_SELECTED = {
    id: 'No disposition selected',
    label: 'No disposition selected',
    value: '',
  };

  const definitionId = form.forms[id]?.formDefinitionId;
  const definition = form.definitions[definitionId];
  const currentForm = form.forms[id];

  const dispositionStates = [...(definition?.dispositionStates ?? [])].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  const [dispositionReason, setDispositionReason] = useState<string>('');
  const [dispositionStatus, setDispositionStatus] = useState<string>(NO_DISPOSITION_SELECTED.value);
  const [showTaskCancelConfirmation, setShowTaskCancelConfirmation] = useState(false);

  const { errors, validators } = useValidators('dispositionReason', 'dispositionReason', isNotEmptyCheck('Reason'))
    .add('dispositionStatus', 'dispositionStatus', isNotEmptyCheck('Disposition'))
    .build();

  const onCompleteValidationCheck = () => {
    onComplete({ formId: form.selected, submissionId, dispositionStatus, dispositionReason });
    validators.clear();
  };

  const disableFormDispositionControls = () => {
    if (task.status === TASK_STATUS.PENDING) return true;

    return task.status === TASK_STATUS.COMPLETED;
  };

  const buttonDisabledForCompleteTask = () => {
    if (dispositionReason === '' || dispositionStatus === '') return true;

    if (dispositionReason !== '' && dispositionStatus === NO_DISPOSITION_SELECTED.label) return true;
    if (dispositionReason === '' && dispositionStatus !== NO_DISPOSITION_SELECTED.label) return true;

    if (Object.keys(errors).length > 0) return true;

    return !user.isWorker || isExecuting;
  };

  const renderDisposition = () => {
    return (
      <div id="form-disposition-block">
        <GoAFormItem requirement="required" error={errors?.['dispositionStatus']} label="Disposition">
          <GoADropdown
            testId="formDispositionStatus"
            value={dispositionStatus}
            disabled={disableFormDispositionControls()}
            onChange={(_, value: string) => {
              setDispositionStatus(value);
              validators.remove('dispositionStatus');
              validators['dispositionStatus'].check(value);
            }}
            relative={true}
            width={'600px'}
          >
            <GoADropdownItem
              key={NO_DISPOSITION_SELECTED.id}
              value={NO_DISPOSITION_SELECTED.value}
              label={NO_DISPOSITION_SELECTED.label}
            />
            {dispositionStates?.map((dip, i) => (
              <GoADropdownItem key={dip.id} value={dip.name} label={dip.description} />
            ))}
          </GoADropdown>
        </GoAFormItem>
      </div>
    );
  };
  const renderReason = () => {
    return (
      <div id="form-reason-block">
        <GoAFormItem label="Reason" requirement="required" error={errors?.['dispositionReason']} mt="m">
          <GoATextArea
            name="reason"
            value={dispositionReason}
            disabled={disableFormDispositionControls()}
            width="600px"
            testId="reason"
            aria-label="reason"
            onKeyPress={(name, value: string) => {
              setDispositionReason(value);
              validators.remove('dispositionReason');
              validators['dispositionReason'].check(value);
            }}
            // eslint-disable-next-line
            onChange={() => {}}
          />
        </GoAFormItem>
      </div>
    );
  };

  const renderButtonGroup = () => {
    return (
      <GoAButtonGroup alignment="end" mt="m">
        <GoAButton type="tertiary" onClick={onClose}>
          Close
        </GoAButton>
        {task?.status === TASK_STATUS.IN_PROGRESS && (
          <>
            <GoAButton
              type="secondary"
              disabled={!user.isWorker || isExecuting}
              onClick={() => {
                setShowTaskCancelConfirmation(true);
              }}
            >
              Cancel Review
            </GoAButton>
            <GoAButton disabled={buttonDisabledForCompleteTask()} onClick={() => onCompleteValidationCheck()}>
              Submit Decision
            </GoAButton>
          </>
        )}
        {task?.status === TASK_STATUS.PENDING && (
          <GoAButton disabled={!user.isWorker || isExecuting} onClick={onStart}>
            Start review
          </GoAButton>
        )}
      </GoAButtonGroup>
    );
  };

  const renderTaskCancelModal = () => {
    return (
      <TaskCancelModal
        title="Cancel Task"
        isOpen={showTaskCancelConfirmation}
        content={
          <div>
            <div>
              Are you sure you wish to cancel <b>{`${task.description}?`}</b>
              <br />
            </div>
          </div>
        }
        onYes={() => {
          onCancel(null);
          setShowTaskCancelConfirmation(false);
        }}
        onNo={() => {
          setShowTaskCancelConfirmation(false);
        }}
      />
    );
  };
  return (
    <TaskDetailsLayout>
      {definition && (
        <FormReviewContainer>
          <JsonForms
            readonly={true}
            schema={definition?.dataSchema}
            uischema={definition?.uiSchema}
            data={currentForm?.formData}
            validationMode="NoValidation"
            renderers={GoAReviewRenderers}
          />
        </FormReviewContainer>
      )}
      <ReviewContent>{renderTaskCancelModal()}</ReviewContent>
      <ActionContainer>
        <form>
          {renderDisposition()}
          {renderReason()}
        </form>
        {renderButtonGroup()}
      </ActionContainer>
    </TaskDetailsLayout>
  );
};

registerDetailsComponent(
  (task) => task?.recordId.startsWith('urn:ads:platform:form-service:v1:/forms/'),
  FormSubmissionReviewTask
);
