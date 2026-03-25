import React, { useContext } from 'react';
import { GoabButton, GoabFormItem } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsAllOfProps } from '@jsonforms/react';
import { PageReviewContainer, ReviewHeader, ReviewLabel, ReviewValue } from '../Inputs/style-component';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';
import { isNilOrEmptyString } from '../../util';

type DateOfBirthReviewControlProps = ControlProps;

export const FullNameDobReviewControl = (props: DateOfBirthReviewControlProps): JSX.Element => {
  const { data, id, uischema } = props;
  const context = useContext(JsonFormsStepperContext);
  const stepId = uischema?.options?.stepId;
  const requiredFields = props.schema?.required ?? [];
  const isMissing = (value: string | null | undefined): boolean => isNilOrEmptyString(value);

  const renderRow = (fieldLabel: string, value: string, fieldName: string, testId: string) => (
    <tr key={testId}>
      <PageReviewContainer colSpan={3}>
        <ReviewHeader>
          <ReviewLabel>{fieldLabel}</ReviewLabel>
          {stepId !== undefined && (
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
      {data?.middleName && renderRow('Middle name', data?.middleName, 'middleName', `middleName-control-${id}`)}
      {renderRow('Last name', data?.lastName, 'lastName', `lastName-control-${id}`)}
      {renderRow('Date of birth', data?.dateOfBirth, 'dateOfBirth', `dob-control-${id}`)}
    </>
  );
};
export const GoAInputBaseFullNameDobControlReview = withJsonFormsAllOfProps(FullNameDobReviewControl);
