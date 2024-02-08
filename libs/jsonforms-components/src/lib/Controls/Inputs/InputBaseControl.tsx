import React from 'react';
import { GoAFormItem } from '@abgov/react-components-new';
import { ControlProps } from '@jsonforms/core';
import { capitalizeFirstLetter, controlScopeMatchesLabel } from '../../util/stringUtils';

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
}

export const GoAInputBaseControl = (props: ControlProps & WithInput): JSX.Element => {
  // eslint-disable-next-line
  const { id, description, errors, label, uischema, visible, required, config, input } = props;
  const isValid = errors.length === 0;
  const InnerComponent = input;
  let labelToUpdate = '';

  if (controlScopeMatchesLabel(uischema.scope, label)) {
    labelToUpdate = capitalizeFirstLetter(label);
  } else {
    labelToUpdate = label;
  }

  let modifiedErrors = errors;
  if (
    errors === 'must be equal to one of the allowed values' &&
    ['EnumSelect', 'EnumSelectAutoComplete'].includes(input?.name)
  ) {
    modifiedErrors = '';
  }
  return required ? (
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
  );
};
