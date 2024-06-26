import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import {
  GoAButtonGroup,
  GoAButton,
  GoAFormItem,
  GoADropdown,
  GoADropdownItem,
  GoATextArea,
} from '@abgov/react-components-new';
import { Grid } from '../../../lib/common/Grid';
import { useDispatch, useSelector } from 'react-redux';
import { TASK_STATUS, TaskDetailsProps } from './types';
import { registerDetailsComponent } from './register';
import {
  AppDispatch,
  formSelector,
  selectForm,
  AppState,
  formLoadingSelector,
  anyFileLoadingSelector,
} from '../../state';
import { getAllRequiredFields } from './getRequiredFields';
import { Categorization, isVisible, ControlElement, Category } from '@jsonforms/core';
import { useValidators } from '../../../lib/validations/useValidators';
import { isNotEmptyCheck } from '../../../lib/validations/checkInput';
import { AdspId } from '../../../lib/adspId';

import {
  ReviewItem,
  //  ReviewItemHeader,
  ReviewItemSection,
  ReviewItemTitle,
  ReviewItemBasic,
  FormDispositionDetail,
  ReviewContainer,
  ReviewContent,
  ActionContainer,
} from './styled-components';
import { RenderFormReviewFields } from './RenderFormReviewFields';
import { ajv } from '../../../lib/validations/checkInput';
import { Element } from './RenderFormReviewFields';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import styled from 'styled-components';
import { TaskCancelModal } from './TaskCancelModal';
// const PlaceholderDiv = styled.div`
//   display: flex;
//   flex-direction: column;

//   > *:first-child {
//     flex-grow: 1;
//   }
// `;

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
  const formIsLoading = useSelector((state: AppState) => formLoadingSelector(state));

  const anyFileIsLoading = useSelector((state: AppState) => anyFileLoadingSelector(state));

  const adspId = AdspId.parse(task.recordId);
  const [_, _type, id, _submission, submissionId] = adspId.resource.split('/');

  // To help determine height of the content container
  const actionContainerRef = useRef(null);
  const [paddingBottom, setPaddingBottom] = useState('60px');

  useEffect(() => {
    dispatch(selectForm({ formId: id, submissionId: submissionId }));
  }, [dispatch, id, submissionId]);

  useEffect(() => {
    if (actionContainerRef.current) {
      const height = actionContainerRef.current.offsetHeight;
      setPaddingBottom(`${height}px`);
    }
  }, []);

  const NO_DISPOSITION_SELECTED = {
    id: 'No disposition selected',
    label: 'No disposition selected',
    value: '',
  };

  const definitionId = form.forms[id]?.formDefinitionId;
  const definition = form.definitions[definitionId];
  const currentForm = form.forms[id];
  const categorization = definition?.uiSchema as Categorization;
  const [categories, setCategories] = React.useState<(Categorization | Category | ControlElement)[]>(
    categorization?.elements
  );

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

  useEffect(() => {
    const cats = categorization?.elements.filter((category) => isVisible(category, currentForm?.formData, '', ajv));
    setCategories(cats as (Categorization | Category | ControlElement)[]);
  }, [categorization, currentForm]);

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

  const loading = formIsLoading || anyFileIsLoading;

  const renderFormSubmissionReview = () => {
    return (
      <div>
        <LoadingIndicator isLoading={loading} />
        {!loading && categories && (
          <ReviewItem>
            {categories.map((category, index) => {
              const categoryLabel = category.label || category.i18n || '';
              const requiredFields = getAllRequiredFields(definition?.dataSchema);

              return (
                <div>
                  {category?.type === 'Control' ? (
                    <ReviewItemBasic>
                      <Element
                        element={category}
                        index={index}
                        data={currentForm?.formData}
                        requiredFields={requiredFields}
                      />
                    </ReviewItemBasic>
                  ) : (
                    // eslint-disable-next-line react/jsx-no-comment-textnodes
                    <ReviewItemSection key={index}>
                      <ReviewItemTitle>{categoryLabel as string}</ReviewItemTitle>
                      <Grid>
                        <RenderFormReviewFields
                          elements={category?.elements}
                          data={currentForm?.formData}
                          requiredFields={requiredFields}
                        />
                      </Grid>
                    </ReviewItemSection>
                  )}
                </div>
              );
            })}
          </ReviewItem>
        )}
      </div>
    );
  };

  const renderFormDisposition = () => {
    return (
      <div id="form-disposition-block">
        <FormDispositionDetail>
          <GoAFormItem requirement="required" error={errors?.['dispositionStatus']} label="Disposition" mt="m" mb="s">
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
              width={'67ch'}
            >
              <GoADropdownItem
                key={NO_DISPOSITION_SELECTED.id}
                value={NO_DISPOSITION_SELECTED.value}
                label={NO_DISPOSITION_SELECTED.label}
              />
              {dispositionStates?.map((dip) => (
                <GoADropdownItem key={dip.id} value={dip.name} label={dip.description} />
              ))}
            </GoADropdown>
          </GoAFormItem>

          <GoAFormItem label="Reason" requirement="required" error={errors?.['dispositionReason']}>
            <GoATextArea
              name="reason"
              value={dispositionReason}
              disabled={disableFormDispositionControls()}
              width="75ch"
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
        </FormDispositionDetail>
      </div>
    );
  };

  const renderButtonGroup = () => {
    return (
      <GoAButtonGroup alignment="start" mt="l">
        {task?.status === TASK_STATUS.IN_PROGRESS && (
          <>
            <GoAButton disabled={buttonDisabledForCompleteTask()} onClick={() => onCompleteValidationCheck()}>
              Complete task
            </GoAButton>
            <GoAButton
              type="secondary"
              disabled={!user.isWorker || isExecuting}
              onClick={() => {
                setShowTaskCancelConfirmation(true);
              }}
            >
              Cancel task
            </GoAButton>
          </>
        )}
        <GoAButton type="tertiary" onClick={onClose}>
          Close
        </GoAButton>
        {task?.status === TASK_STATUS.PENDING && (
          <GoAButton disabled={!user.isWorker || isExecuting} onClick={onStart}>
            Start task
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
    <ReviewContainer>
      <ReviewContent paddingBottom={paddingBottom}>
        {renderFormSubmissionReview()}
        {renderFormDisposition()}
        {renderTaskCancelModal()}
      </ReviewContent>
      <ActionContainer ref={actionContainerRef}>{renderButtonGroup()}</ActionContainer>
    </ReviewContainer>
  );
};

registerDetailsComponent(
  (task) => task?.recordId.startsWith('urn:ads:platform:form-service:v1:/forms/'),
  FormSubmissionReviewTask
);
