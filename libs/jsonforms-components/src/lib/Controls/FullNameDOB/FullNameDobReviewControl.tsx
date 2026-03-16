import React, { useContext } from 'react';
import { GoabButton, GoabFormItem } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsAllOfProps } from '@jsonforms/react';
import {
  PageReviewContainer,
  ReviewHeader,
  ReviewLabel,
  ReviewValue,
  RequiredTextLabel,
} from '../Inputs/style-component';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';
import { REQUIRED_PROPERTY_ERROR } from '../../common/Constants';

type DateOfBirthReviewControlProps = ControlProps;

export const FullNameDobReviewControl = (props: DateOfBirthReviewControlProps): JSX.Element => {
  const { data, id, uischema, label, required, errors } = props;
  const context = useContext(JsonFormsStepperContext);
  const stepId = uischema?.options?.stepId;

  const renderRow = (fieldLabel: string, value: string, testId: string) => (
    <tr key={testId}>
      <PageReviewContainer colSpan={3}>
        <ReviewHeader>
          <ReviewLabel>{fieldLabel}</ReviewLabel>
        </ReviewHeader>
        <ReviewValue>
          <div data-testid={testId}>{value}</div>
        </ReviewValue>
      </PageReviewContainer>
    </tr>
  );

  return (
    <>
      <tr data-testid="fullname-dob-header">
        <PageReviewContainer colSpan={3}>
          <ReviewHeader>
            <ReviewLabel>
              {label}
              {required && <RequiredTextLabel> (required)</RequiredTextLabel>}
            </ReviewLabel>
            {stepId !== undefined && (
              <GoabButton
                type="tertiary"
                size="compact"
                onClick={() => context?.goToPage(stepId, uischema.scope)}
                testId="fullname-dob-change-btn"
              >
                Change
              </GoabButton>
            )}
          </ReviewHeader>
          {errors && (
            <GoabFormItem
              error={errors?.includes(REQUIRED_PROPERTY_ERROR) ? `${label} is required` : errors}
              label=""
            ></GoabFormItem>
          )}
        </PageReviewContainer>
      </tr>
      {renderRow('First name', data?.firstName, `firstName-control-${id}`)}
      {data?.middleName && renderRow('Middle name', data?.middleName, `middleName-control-${id}`)}
      {renderRow('Last name', data?.lastName, `lastName-control-${id}`)}
      {renderRow('Date of birth', data?.dateOfBirth, `dob-control-${id}`)}
    </>
  );
};
export const GoAInputBaseFullNameDobControlReview = withJsonFormsAllOfProps(FullNameDobReviewControl);
