import React, { useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { GoabButton } from '@abgov/react-components';
import { withJsonFormsAllOfProps } from '@jsonforms/react';
import { PageReviewNameCol, PageReviewValueCol } from '../Inputs/style-component';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';

type FullNameControlReviewProps = ControlProps;

export const FullNameControlReview = (props: FullNameControlReviewProps): JSX.Element => {
  const context = useContext(JsonFormsStepperContext);
  const stepId = props.uischema?.options?.stepId;
  const { path } = props;

  const renderRow = (label: string, value: string, testId: string) => (
    <tr>
      <PageReviewNameCol>
        <strong>{label}</strong>
      </PageReviewNameCol>
      <PageReviewValueCol>
        <div data-testid={testId}>{value}</div>
      </PageReviewValueCol>
      <td className="goa-table-width-limit">
        <GoabButton
          type="tertiary"
          size="compact"
          onClick={() => {
            if (context) context.goToPage(stepId, undefined, path);
          }}
        >
          Change
        </GoabButton>
      </td>
    </tr>
  );

  return (
    <>
      {renderRow('First name', props.data?.firstName, `firstName-control-${props.id}`)}
      {props.data?.middleName && renderRow('Middle name', props.data?.middleName, `middleName-control-${props.id}`)}
      {renderRow('Last name', props.data?.lastName, `lastName-control-${props.id}`)}
    </>
  );
};

export const GoAInputBaseFullNameControlReview = withJsonFormsAllOfProps(FullNameControlReview);
