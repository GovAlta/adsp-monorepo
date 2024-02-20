import React, { createContext, useContext, useState } from 'react';
import { GoAFormItem } from '@abgov/react-components-new';
import { ControlProps } from '@jsonforms/core';
import { capitalizeFirstLetter, controlScopeMatchesLabel } from '../../util/stringUtils';
import { Hidden } from '@mui/material';
import { KeyPressPathPair, WithKeyPressInput } from './type';
//import { FormInputContext, FormInputContextProvider } from '../../Context/FormContext/formInputContext';
export type GoAInputType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'month'
  | 'range'
  | 'search'
  | 'tel'
  | 'time'
  | 'url'
  | 'week';

export interface WithInput {
  //eslint-disable-next-line
  input: any;
  noLabel?: boolean;
  //eslint-disable-next-line
  //This can be used by any data we need to passedin to the base control
  additionalData?: any;
}

export const keyPressContains = (keyCode: KeyPressPathPair): boolean => {
  const keysToTest = ['Tab', 'Shift'];
  return keysToTest.includes(keyCode.keyPressCode);
};

type GoAWithInputProps = WithInput & WithKeyPressInput;

const DirtyData = {
  isDirty: false,
  // eslint-disable-next-line
  setIsDirty: (dirty: boolean) => {},
  formInputPath: '',
  // eslint-disable-next-line
  setFormInputPath: (path: string) => {},
};

export const FormInputContext = createContext(DirtyData);

export const GoAInputBaseControl = (props: ControlProps & GoAWithInputProps): JSX.Element => {
  const { id, description, schema, errors, additionalData, path, label, uischema, visible, required, input, data } =
    props;
  const isValid = errors.length === 0;
  const InnerComponent = input;
  let labelToUpdate = '';

  //
  const ctx = useContext(FormInputContext);

  if (controlScopeMatchesLabel(uischema.scope, label)) {
    labelToUpdate = capitalizeFirstLetter(label);
  } else {
    labelToUpdate = label;
  }

  console.log(`isDirty inBase ${JSON.stringify(ctx)}`);
  let modifiedErrors = errors;

  if (required && (errors.includes('should have required property') || data === '')) {
    modifiedErrors = `${labelToUpdate} is required. `;
  }
  if (required && (schema.type === 'integer' || schema.type === 'number') && isNaN(+additionalData)) {
    modifiedErrors = `${labelToUpdate} is required. `;
  }
  if (required && schema.type === 'boolean' && data === false) {
    modifiedErrors = `${labelToUpdate} is required. `;
  }

  if (errors === 'should be equal to one of the allowed values' && uischema?.options?.enumContext) {
    modifiedErrors = '';
  }

  return (
    <Hidden xsUp={!visible}>
      {required ? (
        <GoAFormItem
          requirement="required"
          error={modifiedErrors}
          label={props?.noLabel === true ? '' : labelToUpdate}
          helpText={typeof uischema?.options?.help === 'string' ? uischema?.options?.help : ''}
        >
          <InnerComponent {...props} />
        </GoAFormItem>
      ) : (
        <GoAFormItem
          error={modifiedErrors}
          label={props?.noLabel === true ? '' : labelToUpdate}
          helpText={typeof uischema?.options?.help === 'string' ? uischema?.options?.help : ''}
        >
          <InnerComponent {...props} />
        </GoAFormItem>
      )}
    </Hidden>
  );
};
