import React, { useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { GoabButton, GoabIcon } from '@abgov/react-components';
import { withJsonFormsAllOfProps } from '@jsonforms/react';
import {
  PageReviewContainer,
  ReviewHeader,
  ReviewLabel,
  ReviewValue,
  WarningIconDiv,
  RequiredTextLabel,
} from '../Inputs/style-component';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';

type FullNameControlReviewProps = ControlProps;

export const FullNameControlReview = (props: FullNameControlReviewProps): JSX.Element => {
  const context = useContext(JsonFormsStepperContext);
  const stepId = props.uischema?.options?.stepId;
  const { label, errors, required, uischema, data, id } = props;

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
      <tr data-testid="full-name-header">
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
                testId="full-name-change-btn"
              >
                Change
              </GoabButton>
            )}
          </ReviewHeader>
          {errors && (
            <WarningIconDiv>
              <GoabIcon type="warning" size="small" />
              {errors?.includes('is a required property') ? `${label} is required` : errors}
            </WarningIconDiv>
          )}
        </PageReviewContainer>
      </tr>
      {renderRow('First name', data?.firstName, `firstName-control-${id}`)}
      {data?.middleName && renderRow('Middle name', data?.middleName, `middleName-control-${id}`)}
      {renderRow('Last name', data?.lastName, `lastName-control-${id}`)}
    </>
  );
};

export const GoAInputBaseFullNameControlReview = withJsonFormsAllOfProps(FullNameControlReview);
