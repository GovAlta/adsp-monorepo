import React from 'react';
import { GoAFormItem } from '@abgov/react-components-new';
import { ControlProps } from '@jsonforms/core';
import { FormFieldWrapper } from './style-component';
import { checkFieldValidity, getLabelText } from '../../util/stringUtils';
import { Visible } from '../../util';

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
  const { id, description, errors, uischema, visible, config, label, input, required } = props;
  const isValid = errors.length === 0;
  const InnerComponent = input;
  const labelToUpdate: string = getLabelText(uischema.scope, label || '');

  let modifiedErrors = checkFieldValidity(props as ControlProps);

  if (modifiedErrors === 'should be equal to one of the allowed values' && uischema?.options?.enumContext) {
    modifiedErrors = '';
  }

  return (
    <Visible visible={visible}>
      <FormFieldWrapper>
        <GoAFormItem
          requirement={required ? 'required' : undefined}
          error={modifiedErrors}
          label={props?.noLabel === true ? '' : labelToUpdate}
          helpText={typeof uischema?.options?.help === 'string' ? uischema?.options?.help : ''}
        >
          <InnerComponent {...props} />
        </GoAFormItem>
      </FormFieldWrapper>
    </Visible>
  );
};
