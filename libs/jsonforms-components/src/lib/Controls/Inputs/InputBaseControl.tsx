import React from 'react';
import { GoAFormItem, GoADetails } from '@abgov/react-components-new';
import { ControlProps } from '@jsonforms/core';
import { capitalizeFirstLetter } from '../../util/stringutils';

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

  return (
    <GoAFormItem
      error={errors}
      label={capitalizeFirstLetter(label)}
      helpText={typeof uischema?.options?.help === 'string' ? uischema?.options?.help : ''}
    >
      {(!uischema.options?.variant || uischema.options?.variant !== 'details') &&
        typeof uischema?.options?.help?.content === 'string' && <p>{uischema?.options?.help?.content}</p>}
      {(!uischema.options?.variant || uischema.options?.variant !== 'details') &&
        Array.isArray(uischema?.options?.help?.content) &&
        uischema?.options?.help?.content &&
        uischema?.options?.help?.content.map((line: string, index: number) => <p key={index}>{line}</p>)}

      {uischema.options?.variant && uischema.options?.variant === 'details' && (
        <GoADetails heading={uischema?.options?.help?.label}>{uischema?.options?.help?.content}</GoADetails>
      )}
      <InnerComponent {...props} />
    </GoAFormItem>
  );
};
