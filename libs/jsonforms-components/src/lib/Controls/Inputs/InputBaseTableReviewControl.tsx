import React, { useContext } from 'react';
import { ControlProps, UISchemaElement, JsonSchema } from '@jsonforms/core';
import { ErrorObject } from 'ajv';
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
import { humanizeAjvError } from '../ObjectArray/ListWithDetailControl';
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

  const findMatchingError = (currentErrors: ErrorObject[] | undefined): ErrorObject | undefined => {
    if (!currentErrors) return undefined;
    const normalizedPropPath = normalizePath(path || '');

    for (const e of currentErrors) {
      const errorPath = normalizePath((e as ErrorObject & { dataPath?: string }).dataPath || e.instancePath || '');
      if (errorPath === normalizedPropPath) {
        return e;
      }
      if (e.keyword === 'required') {
        const missing = e.params?.missingProperty;
        if (missing) {
          const missingPath = errorPath ? `${errorPath}.${missing}` : missing;
          if (missingPath === normalizedPropPath) {
            return e;
          }
        }
      }
      if (e.keyword === 'errorMessage' && e.params?.errors) {
        const nested = findMatchingError(e.params.errors as ErrorObject[]);
        if (nested) return nested;
      }
    }
    return undefined;
  };

  const matchedError = findMatchingError(jsonForms.core?.errors);
  let activeError: string | undefined;
  if (matchedError) {
    try {
      activeError = humanizeAjvError(matchedError, schema as JsonSchema, uischema as UISchemaElement);
    } catch (err) {
      // Fallback: try to extract missing property name and create a friendly message
      if (matchedError.keyword === 'required' && matchedError.params?.missingProperty) {
        const missing = matchedError.params.missingProperty as string;
        const missingPropertyLabel = convertToSentenceCase(missing);
        activeError = `${missingPropertyLabel} is required`;
      } else {
        const propertyMatch = matchedError.message?.match(/'([^']+)'/);
        if (propertyMatch && propertyMatch[1]) {
          const missingPropertyLabel = convertToSentenceCase(propertyMatch[1]);
          activeError = `${missingPropertyLabel} is required`;
        } else {
          activeError = matchedError.message;
        }
      }
    }
  }

  if (required && (data === undefined || data === null || data === '') && !activeError) {
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
            <GoabButton type="tertiary" size="compact" onClick={() => context?.goToPage(stepId, uischema.scope)}>
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
