import React from 'react';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { PageReviewNameCol, PageReviewValueCol } from './style-component';
import { getLastSegmentFromPointer } from '../../util';

import { GoAReviewRenderers } from '../../../index';
import { JsonFormsDispatch } from '@jsonforms/react';

export const GoAInputBaseTableReview = (props: ControlProps): JSX.Element => {
  const { data, uischema, label, schema, path, errors, enabled, cells } = props;
  const labelToUpdate: string = label || '';
  let reviewText = data;
  const isBoolean = typeof data === 'boolean';
  if (isBoolean) {
    const checkboxLabel = uischema.options?.text?.trim() || getLastSegmentFromPointer(uischema.scope);

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
      {labelToUpdate && (
        <PageReviewNameCol>
          <strong>{labelToUpdate}</strong>
        </PageReviewNameCol>
      )}
      <PageReviewValueCol>
        {typeof reviewText === 'string' ? (
          <div>{reviewText}</div>
        ) : (
          <JsonFormsDispatch
            data-testid={`jsonforms-object-list-defined-elements-dispatch`}
            schema={schema}
            uischema={uischema}
            enabled={enabled}
            renderers={GoAReviewRenderers}
            cells={cells}
          />
        )}
      </PageReviewValueCol>
    </tr>
  );
};

export const GoAInputBaseTableReviewControl = withJsonFormsControlProps(GoAInputBaseTableReview);
