import React from 'react';
import { GoAFormItem } from '@abgov/react-components-new';
import { ControlProps } from '@jsonforms/core';
import { capitalizeFirstLetter, controlScopeMatchesLabel } from '../../util/stringUtils';
import { Hidden } from '@mui/material';

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
  keyPressCode?: string;
}
export interface WithKeyPressInput {
  keyPressCode?: string;
}

export const keyPressContains = (keyCode: string): boolean => {
  const keysToTest = ['Backspace', 'Tab', 'Shift'];
  return keysToTest.includes(keyCode);
};

type GoAWithInputProps = WithInput & WithKeyPressInput;

export const GoAInputBaseControl = (props: ControlProps & GoAWithInputProps): JSX.Element => {
  // eslint-disable-next-line
  const { id, description, errors, path, label, uischema, visible, required, config, input, data, keyPressCode } =
    props;
  const isValid = errors.length === 0;
  const InnerComponent = input;
  let labelToUpdate = '';

  if (controlScopeMatchesLabel(uischema.scope, label)) {
    labelToUpdate = capitalizeFirstLetter(label);
  } else {
    labelToUpdate = label;
  }

  let modifiedErrors = errors;

  if (required && data !== undefined && data === '' && keyPressCode !== undefined && keyPressContains(keyPressCode)) {
    modifiedErrors = `${label} is required. `;
  }
  if (errors.includes('should have required property')) {
    modifiedErrors = `${label} is required. `;
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
