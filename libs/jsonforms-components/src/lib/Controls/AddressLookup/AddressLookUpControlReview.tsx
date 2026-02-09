import React, { useContext } from 'react';
import { ControlProps } from '@jsonforms/core';
import { ErrorObject } from 'ajv';
import { AddressViews } from './AddressViews';
import { humanizeAjvError } from '../ObjectArray/ListWithDetailControl';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';
import {
  PageReviewContainer,
  ReviewHeader,
  ReviewLabel,
  ReviewValue,
  WarningIconDiv,
  RequiredTextLabel,
} from '../Inputs/style-component';
import { GoabButton, GoabIcon } from '@abgov/react-components';
import { useJsonForms } from '@jsonforms/react';

type AddressViewProps = ControlProps;

export const AddressLookUpControlReview = (props: AddressViewProps): JSX.Element => {
  const { data, schema } = props;

  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';

  return <AddressViews data={data} isAlbertaAddress={isAlbertaAddress} />;
};

export const AddressLoopUpControlTableReview = (props: AddressViewProps): JSX.Element => {
  const { data, schema, uischema, path, label, required } = props;
  const jsonForms = useJsonForms();

  const stepId = uischema.options?.stepId;
  const formStepperCtx = useContext(JsonFormsStepperContext);
  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';

  const provinces = [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'YT', label: 'Yukon' },
  ];

  const provinceLabel = isAlbertaAddress
    ? 'Alberta'
    : provinces.find((p) => p.value === data?.subdivisionCode)?.label || data?.subdivisionCode;

  function prettify(prop: string) {
    return prop
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .replace(/^./, (c) => c.toUpperCase());
  }

  const getError = (propName: string) => {
    const normalizePath = (p: string) =>
      p
        .replace(/\[(\d+)\]/g, '.$1')
        .replace(/^\./, '')
        .replace(/\//g, '.');

    // We need to return the message of the MATCHED error, but findError above returns boolean (mostly) or message if I refactor.
    // Let's refactor to return the error object or message.

    const findMatchingError = (errors: ErrorObject[] | undefined): ErrorObject | undefined => {
      if (!errors) return undefined;
      for (const e of errors) {
        const rawErrorPath = (e as ErrorObject & { dataPath?: string }).dataPath || e.instancePath || '';
        const errorPath = normalizePath(rawErrorPath);
        const currentPath = normalizePath(path || '');
        const dotPath = currentPath ? `${currentPath}.${propName}` : propName;

        if (e.keyword === 'errorMessage' && e.params?.errors) {
          const nested = findMatchingError(e.params.errors);
          if (nested) return e; // Return the wrapper error (contains the custom message)
        }

        if (errorPath === dotPath) return e;

        const isRequiredError = e.keyword === 'required';
        const missingProperty = e.params?.missingProperty;

        if (isRequiredError && missingProperty === propName) {
          if (errorPath === currentPath) return e;
        }
      }
      return undefined;
    };

    const matched = findMatchingError(jsonForms.core?.errors);
    if (!matched) return undefined;

    try {
      return humanizeAjvError(matched, jsonForms.core?.schema as any, jsonForms.core?.uischema as any);
    } catch (err) {
      // fallback to parsing the raw message
      const raw = matched.message;
      if (raw?.includes("must have required property") || raw?.includes('is a required property')) {
        const propertyMatch = raw.match(/'([^']+)'/);
        if (propertyMatch && propertyMatch[1]) {
          return prettify(propertyMatch[1]) + ' is required';
        }
      }
      return raw;
    }
  };

  const isRequired = (propName: string) => {
    return schema?.required?.includes(propName);
  };

  // Build the target scope for the address control
  const targetScope = uischema?.scope || (path ? `#/properties/${path}` : undefined);

  const renderRow = (label: string, value: string | undefined, propName: string, showButton = false) => {
    let error = getError(propName);
    const required = isRequired(propName);

    if (required && !value && !error) {
      error = `${label} is required`;
    }

    return (
      <tr key={propName}>
        <PageReviewContainer colSpan={3}>
          <ReviewHeader>
            <ReviewLabel>
              {label}
              {required && <RequiredTextLabel> (required)</RequiredTextLabel>}
            </ReviewLabel>
            {showButton && stepId !== undefined && (
              <GoabButton
                type="tertiary"
                size="compact"
                onClick={() => formStepperCtx?.goToPage(stepId, targetScope)}
                testId="address-change-btn"
              >
                Change
              </GoabButton>
            )}
          </ReviewHeader>
          <ReviewValue>
            {value}
            {error && (
              <WarningIconDiv>
                <GoabIcon type="warning" size="small" />
                {error?.includes('is a required property') || error?.includes('required property')
                  ? `${label} is required`
                  : error}
              </WarningIconDiv>
            )}
          </ReviewValue>
        </PageReviewContainer>
      </tr>
    );
  };

  return (
    <>
      <tr data-testid="address-lookup-table-review">
        <PageReviewContainer colSpan={3}>
          <ReviewLabel>{`${isAlbertaAddress ? 'Alberta' : 'Canada'} postal address`}</ReviewLabel>
        </PageReviewContainer>
      </tr>
      {renderRow('Address line 1', data?.addressLine1, 'addressLine1', true)}
      {data?.addressLine2 && renderRow('Address line 2', data.addressLine2, 'addressLine2', false)}
      {renderRow('City', data?.municipality, 'municipality', false)}
      {renderRow('Postal Code', data?.postalCode, 'postalCode', false)}
      {renderRow('Province', provinceLabel, 'subdivisionCode', false)}
      {renderRow('Country', 'Canada', 'country', false)}
    </>
  );
};
