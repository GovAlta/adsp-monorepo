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
  const { label, errors, required, uischema } = props;

  const renderRow = (label: string, value: string, testId: string) => (
    <tr>
      <PageReviewContainer colSpan={3}>
        <ReviewHeader>
          <ReviewLabel>{label}</ReviewLabel>
          <GoabButton type="tertiary" size="compact" onClick={() => context?.goToPage(stepId, uischema.scope)}>
            Change
          </GoabButton>
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
          <ReviewLabel>
            {label}
            {required && <RequiredTextLabel> (required)</RequiredTextLabel>}
          </ReviewLabel>
          {errors && (
            <WarningIconDiv>
              <GoabIcon type="warning" size="small" />
              {errors?.includes('is a required property') ? `${label} is required` : errors}
            </WarningIconDiv>
          )}
        </PageReviewContainer>
      </tr>
      {renderRow('First name', props.data?.firstName, `firstName-control-${props.id}`)}
      {props.data?.middleName && renderRow('Middle name', props.data?.middleName, `middleName-control-${props.id}`)}
      {renderRow('Last name', props.data?.lastName, `lastName-control-${props.id}`)}
    </>
  );
};

export const GoAInputBaseFullNameControlReview = withJsonFormsAllOfProps(FullNameControlReview);
