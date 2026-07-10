import React, { useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { GoabButton, GoabFormItem } from '@abgov/react-components-ds1';
import { withJsonFormsAllOfProps } from '@jsonforms/react';
import { PageReviewContainer, ReviewHeader, ReviewLabel, ReviewValue } from '../Inputs/style-component';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';

type ContractInfoControlReviewProps = ControlProps;

export const ContractInfoControlReview = (props: ContractInfoControlReviewProps): JSX.Element => {
  const context = useContext(JsonFormsStepperContext);
  const stepId = props.uischema?.options?.stepId;

  const { uischema, data = {}, id, schema } = props;

  const requiredFields = schema?.required ?? [];

  const isMissing = (value: string | null | undefined): boolean =>
    value === undefined || value === null || value === '';

  const renderRow = (fieldLabel: string, value: string, fieldName: string, testId: string) => (
    <tr key={testId}>
      <PageReviewContainer colSpan={3}>
        <ReviewHeader>
          <ReviewLabel>{fieldLabel}</ReviewLabel>
          {stepId !== undefined && !uischema.options?.componentProps?.readOnly && (
            <GoabButton
              type="text"
              onClick={() => context?.goToPage(stepId, uischema.scope)}
              testId={`${fieldName}-change-btn`}
            >
              Change
            </GoabButton>
          )}
        </ReviewHeader>

        <ReviewValue>
          <div data-testid={testId}>{value ?? ''}</div>

          {requiredFields.includes(fieldName) && isMissing(value) && (
            <GoabFormItem error={`${fieldLabel} is required`} label=""></GoabFormItem>
          )}
        </ReviewValue>
      </PageReviewContainer>
    </tr>
  );

  const { options } = uischema;
  const enableEmail = options?.enableEmail ?? true;
  const enablePhone = options?.enablePhone ?? true;
  const emailFirst = options?.emailFirst ?? false;

  if (!enableEmail && !enablePhone) {
    throw new Error('At least one contact method must be enabled');
  }

  return (
    <>
      {enableEmail && emailFirst && renderRow('Email', data?.email, 'email', `email-control-${id}`)}

      {enablePhone && renderRow('Phone number', data?.phone, 'phone', `phone-control-${id}`)}

      {enableEmail && !emailFirst && renderRow('Email', data?.email, 'email', `email-control-${id}`)}

      {enableEmail &&
        enablePhone &&
        renderRow(
          'Preferred contact method',
          data?.preferredContactMethod || 'Email',
          'preferredContactMethod',
          `preferred-contact-${id}`,
        )}
    </>
  );
};

export const GoAContractInfoControlReview = withJsonFormsAllOfProps(ContractInfoControlReview);
