import React, { useContext } from 'react';
import type { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  PageReviewContainer,
  ReviewHeader,
  ReviewLabel,
  ReviewValue,
  WarningIconDiv,
  RequiredTextLabel,
} from './style-component';
import { convertToSentenceCase, getLastSegmentFromPointer } from '../../util';
import { getLabelText } from '../../util/stringUtils';
import { GoabButton, GoabIcon } from '@abgov/react-components';

import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';

export const GoAInputBaseTableReview = (props: ControlProps): JSX.Element => {
  const { data, uischema, label, schema, path, errors, enabled, cells, required } = props;
  const context = useContext(JsonFormsStepperContext);
  const jsonForms = useJsonForms();
  let labelToUpdate: string = uischema.options?.reviewLabel
    ? (uischema.options.reviewLabel as string)
    : convertToSentenceCase(getLabelText(uischema.scope, label || ''));
  if (labelToUpdate === '') {
    const scopeName = uischema.scope ? getLastSegmentFromPointer(uischema.scope) : '';
    labelToUpdate = convertToSentenceCase(scopeName);
  }
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

  // Helper to extract errors manually from global state, bypassing "touched" filter
  const normalizePath = (p: string) =>
    p
      .replace(/\[(\d+)\]/g, '.$1')
      .replace(/^\./, '')
      .replace(/\//g, '.');

  const findMatchingError = (currentErrors: any[] | undefined): string | undefined => {
    if (!currentErrors) return undefined;
    const normalizedPropPath = normalizePath(path || '');

    for (const e of currentErrors) {
      const errorPath = normalizePath((e as any).dataPath || (e as any).instancePath || '');
      if (errorPath === normalizedPropPath) {
        return e.message;
      }
      if (e.keyword === 'required') {
        const missing = e.params?.missingProperty;
        if (missing) {
          const missingPath = errorPath ? `${errorPath}.${missing}` : missing;
          if (missingPath === normalizedPropPath) {
            return e.message;
          }
        }
      }
      if (e.keyword === 'errorMessage' && e.params?.errors) {
        const nested = findMatchingError(e.params.errors);
        if (nested) return e.message;
      }
    }
    return undefined;
  };
  let activeError = findMatchingError(jsonForms.core?.errors);
  if (required && (data === undefined || data === null || data === '') && !activeError) {
    activeError = `${labelToUpdate} is required`;
  } else if (activeError?.includes('is a required property') || activeError?.includes('must have required property')) {
    activeError = `${labelToUpdate} is required`;
  }

  // eslint-disable-next-line
  const stepId = uischema.options?.stepId;

  return (
    <tr data-testid={`input-base-table-${label}-row`}>
      <PageReviewContainer colSpan={3}>
        <ReviewHeader>
          <ReviewLabel>
            {labelToUpdate}
            {required && <RequiredTextLabel> (required)</RequiredTextLabel>}
          </ReviewLabel>
          {stepId !== undefined && (
            <GoabButton type="tertiary" size="compact" onClick={() => context?.goToPage(stepId)}>
              Change
            </GoabButton>
          )}
        </ReviewHeader>
        <ReviewValue>
          {typeof reviewText === 'string' || typeof reviewText === 'number' ? (
            <div data-testid={`review-value-${label}`}>{reviewText}</div>
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
          {activeError && (
            <WarningIconDiv>
              <GoabIcon type="warning" size="small" />
              {activeError}
            </WarningIconDiv>
          )}
        </ReviewValue>
      </PageReviewContainer>
    </tr>
  );
};
export const GoAInputBaseTableReviewControl = withJsonFormsControlProps(GoAInputBaseTableReview);
