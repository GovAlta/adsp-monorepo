import React, { FunctionComponent, useEffect, useState } from 'react';
import {
  GoAButtonGroup,
  GoAButton,
  GoAFormItem,
  GoADropdown,
  GoADropdownItem,
  GoATextArea,
  GoASpacer,
  GoABlock,
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

  const definitionId = form.forms[id]?.formDefinitionId;
  const definition = form.definitions[definitionId];
  const currentForm = form.forms[id];
  const categorization = definition?.uiSchema as Categorization;
  const [categories, setCategories] = React.useState<(Categorization | Category | ControlElement)[]>(
    categorization?.elements
  );
  const [dispositionReason, setDispositionReason] = useState<string>('');
  const [dispositionStatus, setDispositionStatus] = useState<string>('');

  useEffect(() => {
    const cats = categorization?.elements.filter((category) => isVisible(category, currentForm?.formData, '', ajv));
    setCategories(cats as (Categorization | Category | ControlElement)[]);
  }, [categorization, currentForm]);

  const renderFormSubmissionReview = () => {
    return (
      <PlaceholderDiv>
        <GoAAccordion ml="s" heading="Form submission review" open={true}>
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
        </GoAAccordion>
      </PlaceholderDiv>
    );
  };

  const renderFormDisposition = () => {
    return (
      <GoAAccordion ml="s" heading="Form disposition">
        <FormDispositionDetail>
          <GoAFormItem label="Disposition" mt="m" mb="s">
            <GoADropdown
              testId="formDispositionStatus"
              value={dispositionStatus}
              onChange={(_, value: string) => {
                setDispositionStatus(value);
              }}
              relative={true}
              width={'50ch'}
            >
              <GoADropdownItem key="" value="" label="" />
              {/* {workers.map((w) => (
                <GoADropdownItem key={w.id} value={w.id} label={w.name} />
              ))} */}
            </GoADropdown>
          </GoAFormItem>

          <GoAFormItem label="Reason">
            <GoATextArea
              name="reason"
              value={dispositionReason}
              width="100ch"
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
      </GoAAccordion>
    );
  };

  return (
    <div>
      {renderFormSubmissionReview()}
      {renderFormDisposition()}

      <GoAButtonGroup alignment="start" mt="l">
        <GoAButton type="secondary" onClick={onClose}>
          Close
        </GoAButton>
        {task?.status === 'Pending' && (
          <GoAButton disabled={!user.isWorker || isExecuting} onClick={onStart}>
            Start task
          </GoAButton>
        )}
        {task?.status === 'In Progress' && (
          <>
            <GoAButton type="secondary" disabled={!user.isWorker || isExecuting} onClick={() => onCancel(null)}>
              Cancel task
            </GoAButton>
            <GoAButton disabled={!user.isWorker || isExecuting} onClick={onComplete}>
              Complete task
            </GoAButton>
          </>
        )}
      </GoAButtonGroup>
    </div>
  );
};

registerDetailsComponent(
  (task) => task?.recordId.startsWith('urn:ads:platform:form-service:v1:/forms/'),
  FormSubmissionReviewTask
);
