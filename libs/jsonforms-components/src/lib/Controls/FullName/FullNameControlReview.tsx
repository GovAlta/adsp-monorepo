import React, { useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { GoabButton, GoabFormItem } from '@abgov/react-components';
import { withJsonFormsAllOfProps } from '@jsonforms/react';
import { PageReviewContainer, ReviewHeader, ReviewLabel, ReviewValue } from '../Inputs/style-component';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';
import { isNilOrEmptyString } from '../../util';
import { RequiredTextLabel } from '../Inputs/style-component';

type FullNameControlReviewProps = ControlProps;

export const FullNameControlReview = (props: FullNameControlReviewProps): JSX.Element => {
  const context = useContext(JsonFormsStepperContext);
  const stepId = props.uischema?.options?.stepId;
  const { uischema, data, id } = props;
  const requiredFields = props.schema?.required ?? [];
  const isMissing = (value: string | null | undefined): boolean => isNilOrEmptyString(value);

  const renderRow = (fieldLabel: string, value: string, fieldName: string, testId: string) => (
    <tr key={testId}>
      <PageReviewContainer colSpan={3}>
        <ReviewHeader>
          <ReviewLabel>
            {fieldLabel}
            {requiredFields.includes(fieldName) && <RequiredTextLabel> (required)</RequiredTextLabel>}
          </ReviewLabel>
          {stepId !== undefined && !uischema.options?.componentProps?.readOnly && (
            <GoabButton
              type="tertiary"
              size="compact"
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

  return (
    <>
      {renderRow('First name', data?.firstName, 'firstName', `firstName-control-${id}`)}
      {renderRow('Middle name', data?.middleName, 'middleName', `middleName-control-${id}`)}
      {renderRow('Last name', data?.lastName, 'lastName', `lastName-control-${id}`)}
    </>
  );
};

export const GoAInputBaseFullNameControlReview = withJsonFormsAllOfProps(FullNameControlReview);
