import React, { useContext } from 'react';
import { GoAFormItem, GoADetails } from '@abgov/react-components-new';
import { ControlProps } from '@jsonforms/core';
import { enumContext } from '../../../index';

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
  // eslint-disable-next-line
  const { id, description, errors, label, uischema, visible, required, config, input } = props;
  const isValid = errors.length === 0;
  const InnerComponent = input;

  const enumerators = useContext(enumContext);
  const getter = enumerators.getters.get(uischema?.options?.enumContext);
  const values = getter ? getter() : ['null', 'values'];

  if (uischema?.options?.enumContext) {
    if (typeof values === 'function') {
      console.log('FUNCTION PUTT PUTT: ' + 'values()');
    } else {
      console.log('PUTT PUTT PUTT: ' + values);
    }
  }

  return (
    <GoAFormItem error={errors} label={label} helpText={uischema?.options?.help}>
      {uischema.options?.variant && uischema.options?.variant === 'details' && (
        <GoADetails heading={uischema?.options?.help?.label}>{uischema?.options?.help?.content}</GoADetails>
      )}
      <InnerComponent {...props} />
    </GoAFormItem>
  );
};
