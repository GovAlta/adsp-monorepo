import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  GoAButtonGroup,
  GoAButton,
  GoAFormItem,
  GoADropdown,
  GoADropdownItem,
  GoATextArea,
  GoADetails,
  GoAAccordion,
} from '@abgov/react-components-new';
import { Grid } from '../../../lib/common/Grid';
import { useDispatch, useSelector } from 'react-redux';
import { TaskDetailsProps } from './types';
import { registerDetailsComponent } from './register';
import { AppDispatch, formSelector, selectForm, AppState, formLoadingSelector } from '../../state';
import { getAllRequiredFields } from './getRequiredFields';
import { Categorization, isVisible, ControlElement, Category } from '@jsonforms/core';
import { useValidators } from '../../../lib/validations/useValidators';
import { isNotEmptyCheck } from '../../../lib/validations/checkInput';
import { AdspId } from '../../../lib/adspId';

import {
  ReviewItem,
  ReviewItemHeader,
  ReviewItemSection,
  ReviewItemTitle,
  ReviewItemBasic,
  FormDispositionDetail,
} from './styled-components';
import { RenderFormReviewFields } from './RenderFormReviewFields';
import { ajv } from '../../../lib/validations/checkInput';
import { Element } from './RenderFormReviewFields';
import { LoadingIndicator } from '../../components/LoadingIndicator';
import styled from 'styled-components';
const PlaceholderDiv = styled.div`
  display: flex;
  flex-direction: column;

  > *:first-child {
    flex-grow: 1;
  }
`;

export const FormSubmissionReviewTask: FunctionComponent<TaskDetailsProps> = ({
  user,
  task,
  isExecuting,
  onClose,
  onStart,
  onComplete,
  onSetCompleteData,
  onCancel,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const form = useSelector(formSelector);
  const isLoading = useSelector((state: AppState) => formLoadingSelector(state));

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
  const categorization = definition?.uiSchema as Categorization;
  const [categories, setCategories] = React.useState<(Categorization | Category | ControlElement)[]>(
    categorization?.elements
  );

  const dispositionStates = [...(definition?.dispositionStates ?? [])].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  );

  const [dispositionReason, setDispositionReason] = useState<string>('');
  const [dispositionStatus, setDispositionStatus] = useState<string>(NO_DISPOSITION_SELECTED.value);

  const { errors, validators } = useValidators('dispositionReason', 'dispositionReason', isNotEmptyCheck('Reason'))
    .add('dispositionStatus', 'dispositionStatus', isNotEmptyCheck('Disposition'))
    .build();

  const onCompleteValidationCheck = () => {
    if (dispositionStatus !== NO_DISPOSITION_SELECTED.value && dispositionReason === '') {
      validators.remove('dispositionReason');
      validators.remove('dispositionStatus');
      validators['dispositionReason'].check(dispositionReason);
      return;
    } else if (dispositionReason !== '' && dispositionStatus === NO_DISPOSITION_SELECTED.value) {
      validators.remove('dispositionReason');
      validators.remove('dispositionStatus');
      validators['dispositionStatus'].check(dispositionStatus);
      return;
    }
    onSetCompleteData({ formId: form.selected, submissionId, dispositionStatus, dispositionReason });
    //onComplete();
    validators.clear();
  };

  useEffect(() => {
    const cats = categorization?.elements.filter((category) => isVisible(category, currentForm?.formData, '', ajv));
    setCategories(cats as (Categorization | Category | ControlElement)[]);
  }, [categorization, currentForm]);

  const renderFormSubmissionReview = () => {
    return (
      <PlaceholderDiv>
        <GoADetails ml="s" heading="Form submission review">
          <ReviewItem>
            {categories &&
              categories.map((category, index) => {
                const categoryLabel = category.label || category.i18n || '';
                const requiredFields = getAllRequiredFields(definition?.dataSchema);

                return (
                  <div>
                    <LoadingIndicator isLoading={isLoading} />
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
                      <ReviewItemSection key={index}>
                        <ReviewItemHeader>
                          <ReviewItemTitle>{categoryLabel as string}</ReviewItemTitle>
                        </ReviewItemHeader>
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
        </GoADetails>
      </PlaceholderDiv>
    );
  };

  const renderFormDisposition = () => {
    return (
      <GoADetails ml="s" heading="Form disposition">
        <FormDispositionDetail>
          <GoAFormItem error={errors?.['dispositionStatus']} label="Status" mt="m" mb="s">
            <GoADropdown
              testId="formDispositionStatus"
              value={dispositionStatus}
              onChange={(_, value: string) => {
                setDispositionStatus(value);
              }}
              relative={true}
              width={'67ch'}
            >
              <GoADropdownItem
                key={NO_DISPOSITION_SELECTED.id}
                value={NO_DISPOSITION_SELECTED.value}
                label={NO_DISPOSITION_SELECTED.label}
              />
              {dispositionStates?.sort().map((dip) => (
                <GoADropdownItem key={dip.id} value={dip.name} label={dip.description} />
              ))}
            </GoADropdown>
          </GoAFormItem>

          <GoAFormItem label="Reason" error={errors?.['dispositionReason']}>
            <GoATextArea
              name="reason"
              value={dispositionReason}
              width="75ch"
              testId="reason"
              aria-label="reason"
              onKeyPress={(name, value: string) => {
                setDispositionReason(value);
              }}
              // eslint-disable-next-line
              onChange={() => {}}
            />
          </GoAFormItem>
        </FormDispositionDetail>
      </GoADetails>
    );
  };

  const buttonDisabledForCompleteTask = () => {
    if (dispositionReason !== '' && dispositionStatus === NO_DISPOSITION_SELECTED.label) return true;
    if (dispositionReason === '' && dispositionStatus !== NO_DISPOSITION_SELECTED.label) return true;

    return !user.isWorker || isExecuting;
  };

  return (
    <div>
      {renderFormSubmissionReview()}
      {renderFormDisposition()}

      <GoAButtonGroup alignment="start" mt="l">
        {task?.status === 'In Progress' && (
          <>
            <GoAButton disabled={!user.isWorker || isExecuting} onClick={() => onCompleteValidationCheck()}>
              Complete task
            </GoAButton>
            <GoAButton type="secondary" disabled={!user.isWorker || isExecuting} onClick={() => onCancel(null)}>
              Cancel task
            </GoAButton>
          </>
        )}
        <GoAButton type="tertiary" onClick={onClose}>
          Close
        </GoAButton>
        {task?.status === 'Pending' && (
          <GoAButton disabled={!user.isWorker || isExecuting} onClick={onStart}>
            Start task
          </GoAButton>
        )}
      </GoAButtonGroup>
    </div>
  );
};

registerDetailsComponent(
  (task) => task?.recordId.startsWith('urn:ads:platform:form-service:v1:/forms/'),
  FormSubmissionReviewTask
);
