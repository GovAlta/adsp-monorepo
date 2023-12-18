import React, { ReactNode } from 'react';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInput, GoAFormItem } from '@abgov/react-components-new';
import { showAsRequired, ControlProps, isDescriptionHidden, ControlElement } from '@jsonforms/core';

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
}

export const GoAInputBaseControl = (props: ControlProps & WithInput): JSX.Element => {
  const { id, description, errors, label, uischema, visible, required, config, input } = props;
  const isValid = errors.length === 0;
  const InnerComponent = input;

  return (
    <GoAFormItem error={errors} label={label}>
      <InnerComponent {...props} />
    </GoAFormItem>
  );
};
