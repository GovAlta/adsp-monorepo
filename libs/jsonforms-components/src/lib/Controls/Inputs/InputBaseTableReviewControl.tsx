import React, { useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { PageReviewNameCol, PageReviewValueCol } from './style-component';
import { convertToSentenceCase, getLastSegmentFromPointer } from '../../util';
import { getLabelText } from '../../util/stringUtils';
import { GoabButton } from '@abgov/react-components';

import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';

export const GoAInputBaseTableReview = (props: ControlProps): JSX.Element => {
  const { data, uischema, label, schema, path, errors, enabled, cells } = props;
  const context = useContext(JsonFormsStepperContext);
  const jsonForms = useJsonForms();
  const labelToUpdate: string = convertToSentenceCase(getLabelText(uischema.scope, label || ''));
  let reviewText = data;
  const isBoolean = typeof data === 'boolean';
  if (isBoolean) {
    let checkboxLabel = '';

    if (uischema.options?.text?.trim()) {
      checkboxLabel = uischema.options.text.trim();
    } else if (uischema.scope && uischema.scope.startsWith('#/')) {
      const fallbackLabel = getLastSegmentFromPointer(uischema.scope);
      checkboxLabel = fallbackLabel.charAt(0).toUpperCase() + fallbackLabel.slice(1);
    }

    if (uischema.options?.radio === true) {
      reviewText = data ? `Yes` : `No`;
    } else {
      if (label !== '' || typeof label === 'boolean') {
        reviewText = data ? `Yes` : `No`;
      } else {
        reviewText = data ? `Yes (${checkboxLabel})` : `No (${checkboxLabel})`;
      }
    }
  }

  // eslint-disable-next-line
  const stepId = uischema.options?.stepId;

  return (
    <tr data-testid={`input-base-table-${label}-row`}>
      {labelToUpdate && (
        <PageReviewNameCol>
          <strong>{labelToUpdate}</strong>
        </PageReviewNameCol>
      )}
      <PageReviewValueCol>
        {typeof reviewText === 'string' || typeof reviewText === 'number' ? (
          <div>{reviewText}</div>
        ) : (
          <JsonFormsDispatch
            data-testid={`jsonforms-object-list-defined-elements-dispatch`}
            schema={schema}
            uischema={uischema}
            enabled={enabled}
            renderers={jsonForms.renderers}
            cells={cells}
          />
        )}
      </PageReviewValueCol>
      <td className="goa-table-number-col">
        {stepId !== undefined && (
          <GoabButton type="tertiary" size="compact" onClick={() => context?.goToPage(stepId)}>
            Change
          </GoabButton>
        )}
      </td>
    </tr>
  );
};
export const GoAInputBaseTableReviewControl = withJsonFormsControlProps(GoAInputBaseTableReview);
