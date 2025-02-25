import React, { useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAButton } from '@abgov/react-components';
import { PageReviewActionCol, PageReviewNameCol, PageReviewValueCol } from './style-component';
import { convertToSentenceCase, getLastSegmentFromPointer } from '../../util';
import { getLabelText } from '../../util/stringUtils';
import { JsonFormsStepperContextProps, JsonFormsStepperContext } from '../FormStepper/context';

export const GoAInputBaseTableReview = (props: ControlProps): JSX.Element => {
  const { data, uischema, label } = props;
  const labelToUpdate: string = convertToSentenceCase(getLabelText(uischema.scope, label || ''));
  const categoryIndex = uischema.options?.categoryIndex;
  const formStepperCtx = useContext(JsonFormsStepperContext);
  let reviewText = data;
  const isBoolean = typeof data === 'boolean';
  if (isBoolean) {
    const checkboxLabel =
      uischema.options?.text?.trim() || convertToSentenceCase(getLastSegmentFromPointer(uischema.scope));

    if (uischema.options?.radio === true) {
      reviewText = data ? `Yes` : `No`;
    } else {
      if (label !== '' || typeof label === 'boolean') {
        reviewText = data ? `Yes` : `No`;
      } else {
        reviewText = data ? `Yes (${checkboxLabel.trim()})` : `No (${checkboxLabel.trim()})`;
      }
    }
  }

  return (
    <tr data-testid={`input-base-table-${label}-row`}>
      <PageReviewNameCol>
        <strong>{labelToUpdate}</strong>
      </PageReviewNameCol>
      <PageReviewValueCol>{reviewText}</PageReviewValueCol>
      <PageReviewActionCol>
        <GoAButton
          type="tertiary"
          testId={`page-review-change-${label}-btn`}
          onClick={() => {
            if (formStepperCtx) {
              formStepperCtx.toggleShowReviewLink(categoryIndex);
              formStepperCtx.goToPage(categoryIndex);
            }
          }}
        >
          Change
        </GoAButton>
      </PageReviewActionCol>
    </tr>
  );
};

export const GoAInputBaseTableReviewControl = withJsonFormsControlProps(GoAInputBaseTableReview);
