import React, { act, useContext } from 'react';
import { ControlProps, UISchemaElement, JsonSchema } from '@jsonforms/core';
import { ErrorObject } from 'ajv';
import { withJsonFormsControlProps } from '@jsonforms/react';
import {
  PageReviewContainer,
  ReviewHeader,
  ReviewLabel,
  ReviewValue,
  RequiredTextLabel,
  NoneGivenText,
} from './style-component';
import {
  convertToReadableFormat,
  getGeneratedLabelFromScope,
  controlScopeMatchesLabel,
  getLabelText,
  getLastSegmentFromPointer,
  isNilOrEmptyValue,
} from '../../util';
import { humanizeAjvError } from '../ObjectArray/ListWithDetailControl';
import { GoabButton, GoabFormItem } from '@abgov/react-components-ds1';

import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';
import { useReviewContext } from '../../Context/ReviewRenderContext';
import { JsonFormsDispatch, useJsonForms } from '@jsonforms/react';

export const GoAInputBaseTableReview = (props: ControlProps): JSX.Element | null => {
  const { data, uischema, label, schema, rootSchema, path, errors, enabled, cells, required, visible } = props;
  const context = useContext(JsonFormsStepperContext);
  const reviewCtx = useReviewContext();
  const jsonForms = useJsonForms();
  const reviewLabel = typeof uischema.options?.reviewLabel === 'string' ? (uischema.options.reviewLabel as string) : '';
  const propLabel = typeof label === 'string' ? label : '';

  if (visible === false) {
    return null;
  }

  let labelToUpdate: string = '';
  if (reviewLabel.trim() !== '') {
    labelToUpdate = reviewLabel;
  } else if (typeof schema?.title === 'string' && schema.title.trim()) {
    labelToUpdate = schema.title;
  } else if (propLabel.trim() !== '') {
    if (uischema.scope?.startsWith('#/') && controlScopeMatchesLabel(uischema.scope, propLabel)) {
      labelToUpdate = getLabelText(uischema.scope, propLabel);
    } else {
      labelToUpdate = propLabel;
    }
  } else if (uischema.scope?.startsWith('#/')) {
    labelToUpdate = getGeneratedLabelFromScope(uischema.scope);
  } else {
    labelToUpdate = propLabel;
  }
  let reviewText = data;
  const isBoolean = typeof data === 'boolean';

  const getArrayDisplayValues = (): string[] => {
    if (!Array.isArray(data)) {
      return [];
    }

    const itemSchema = (schema as JsonSchema)?.items as JsonSchema | undefined;
    const oneOf = (itemSchema?.oneOf ?? []) as Array<{ const?: string; title?: string }>;
    const titleByConst = new Map<string, string>();
    oneOf.forEach((option) => {
      if (!option?.const) return;
      titleByConst.set(option.const, option.title ?? option.const);
    });

    return data.map((value) => {
      const raw = typeof value === 'string' ? value : String(value);
      return titleByConst.get(raw) || raw;
    });
  };

  if (isBoolean) {
    let checkboxLabel = '';

    if (uischema.options?.text?.trim()) {
      checkboxLabel = uischema.options.text.trim();
    } else if (uischema.scope && uischema.scope.startsWith('#/')) {
      checkboxLabel = getGeneratedLabelFromScope(uischema.scope);
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

  if (Array.isArray(data) && data.length > 0) {
    const displayValues = getArrayDisplayValues();
    reviewText = (
      <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
        {displayValues.map((value, index) => (
          <li key={`${value}-${index}`}>{value}</li>
        ))}
      </ul>
    );
  }

  // Helper to extract errors manually from global state, bypassing "touched" filter
  const normalizePath = (p: string) =>
    p
      .replace(/\[(\d+)\]/g, '.$1')
      .replace(/\//g, '.')
      .replace(/^\./, '');

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
      if (matchedError.keyword === 'errorMessage' && matchedError.message) {
        activeError = matchedError.message;
      } else if (matchedError.keyword === 'minItems') {
        const minItemsError = (schema as JsonSchema & { errorMessage?: { minItems?: string } }).errorMessage?.minItems;
        activeError =
          minItemsError || humanizeAjvError(matchedError, schema as JsonSchema, uischema as UISchemaElement);
      } else {
        activeError = humanizeAjvError(
          matchedError,
          ((rootSchema as JsonSchema) ?? (schema as JsonSchema)) as JsonSchema,
          uischema as UISchemaElement,
        );
      }
    } catch (err) {
      // Fallback: try to extract missing property name and create a friendly message
      if (matchedError.keyword === 'required' && matchedError.params?.missingProperty) {
        const missing = matchedError.params.missingProperty as string;
        const missingPropertyLabel = convertToReadableFormat(missing);
        activeError = `${missingPropertyLabel} is required`;
      } else if (matchedError.keyword === 'minItems') {
        activeError = (schema as JsonSchema & { errorMessage?: { minItems?: string } }).errorMessage?.minItems;
      } else {
        const propertyMatch = matchedError.message?.match(/'([^']+)'/);
        if (propertyMatch && propertyMatch[1]) {
          const missingPropertyLabel = convertToReadableFormat(propertyMatch[1]);
          activeError = `${missingPropertyLabel} is required`;
        } else {
          activeError = matchedError.message;
        }
      }
    }
  }

  if (!activeError && typeof errors === 'string' && errors.trim() !== '') {
    activeError = errors;
  }

  const isRegisterBackedEnumFalsePositive =
    uischema?.options?.register !== undefined &&
    !isNilOrEmptyValue(data, true) &&
    typeof activeError === 'string' &&
    activeError.toLowerCase().includes('must be equal to one of the allowed values');

  if (isRegisterBackedEnumFalsePositive) {
    activeError = undefined;
  }

  if (activeError && /\sis required$/i.test(activeError)) {
    activeError = `${labelToUpdate} is required`;
  }

  // For required boolean fields (e.g. anyOf: [{enum: [true]}]), suppress the raw AJV
  // "must be equal to one of the allowed values" error and show a friendly message instead.
  if (schema?.type === 'boolean' && activeError && activeError.toLowerCase().includes('must be equal')) {
    activeError = data === false ? `${labelToUpdate} is required` : undefined;
  }

  if (required && isNilOrEmptyValue(data, true) && !activeError) {
    activeError = `${labelToUpdate} is required`;
  }

  // If a required checkbox is unchecked, show only the validation message in
  // review mode (not a contradictory "No (...)" value line).
  let isBooleanRequiredError = false;
  if (schema?.type === 'boolean' && data === false && activeError && /\sis required$/i.test(activeError)) {
    reviewText = '';
    isBooleanRequiredError = true;
  }

  // eslint-disable-next-line
  const stepId = uischema.options?.stepId;

  function handleChangeClick(): void {
    context?.goToPage(stepId, uischema.scope);
    reviewCtx?.onChangeDispatch(stepId, uischema.scope);
  }
  const showInlineValue =
    reviewText === null ||
    reviewText === undefined ||
    typeof reviewText === 'string' ||
    typeof reviewText === 'number' ||
    React.isValidElement(reviewText) ||
    (Array.isArray(reviewText) && reviewText.length === 0);

  const isValueEmpty =
    !isBooleanRequiredError &&
    (reviewText === null ||
      reviewText === undefined ||
      reviewText === '' ||
      (Array.isArray(reviewText) && reviewText.length === 0));

  return (
    <tr data-testid={`input-base-table-${label}-row`}>
      <PageReviewContainer colSpan={3}>
        <ReviewHeader>
          <ReviewLabel>
            {labelToUpdate}
            {required && <RequiredTextLabel> (required)</RequiredTextLabel>}
          </ReviewLabel>
          {stepId !== undefined && !uischema.options?.componentProps?.readOnly && (
            <GoabButton type="tertiary" onClick={handleChangeClick}>
              Change
            </GoabButton>
          )}
        </ReviewHeader>
        <ReviewValue>
          {showInlineValue ? (
            <div data-testid={`review-value-${label}`}>
              {isValueEmpty ? <NoneGivenText>(none given)</NoneGivenText> : (reviewText ?? '')}
            </div>
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
          {activeError && <GoabFormItem error={activeError} label=""></GoabFormItem>}
        </ReviewValue>
      </PageReviewContainer>
    </tr>
  );
};
export const GoAInputBaseTableReviewControl = withJsonFormsControlProps(GoAInputBaseTableReview);
