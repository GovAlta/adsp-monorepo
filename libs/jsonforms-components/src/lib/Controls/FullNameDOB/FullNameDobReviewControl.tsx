import React, { useContext } from 'react';
import { GoabButton } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsAllOfProps } from '@jsonforms/react';
import { PageReviewNameCol, PageReviewValueCol } from '../Inputs/style-component';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';

type DateOfBirthReviewControlProps = ControlProps;

export const FullNameDobReviewControl = (props: DateOfBirthReviewControlProps): JSX.Element => {
  const { data, id, uischema } = props;
  const context = useContext(JsonFormsStepperContext);
  const stepId = uischema?.options?.stepId;

  const renderRow = (label: string, value: string, testId: string) => (
    <tr>
      <PageReviewNameCol>
        <strong>{label}</strong>
      </PageReviewNameCol>
      <PageReviewValueCol>
        <div data-testid={testId}>{value}</div>
      </PageReviewValueCol>
      <td className="goa-table-width-limit">
        <GoabButton type="tertiary" size="compact" onClick={() => context?.goToPage(stepId)}>
          Change
        </GoabButton>
      </td>
    </tr>
  );

  return (
    <>
      {renderRow('First name', data?.firstName, `firstName-control-${id}`)}
      {data?.middleName && renderRow('Middle name', data?.middleName, `middleName-control-${id}`)}
      {renderRow('Last name', data?.lastName, `lastName-control-${id}`)}
      {renderRow('Date of birth', data?.dateOfBirth, `dob-control-${id}`)}
    </>
  );
};
export const GoAInputBaseFullNameDobControlReview = withJsonFormsAllOfProps(FullNameDobReviewControl);
