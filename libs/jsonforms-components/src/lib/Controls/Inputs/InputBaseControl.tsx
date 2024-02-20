import React, { useContext } from 'react';
import { GoAFormItem } from '@abgov/react-components-new';
import { JsonFormContext } from '../../Context';
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
}

export const GoAInputBaseControl = (props: ControlProps & WithInput): JSX.Element => {
  // eslint-disable-next-line
  const { id, description, errors, label, uischema, visible, required, config, input } = props;
  const isValid = errors.length === 0;
  const InnerComponent = input;
  let labelToUpdate = '';

  const enumerators = useContext(JsonFormContext);

  const dirtyFunction = enumerators.data.get('dirty');
  const dirty = dirtyFunction && dirtyFunction();

  const formInputPathFunction = enumerators.data.get('formInputPath');
  const formInputPath = formInputPathFunction && formInputPathFunction();
  if (controlScopeMatchesLabel(uischema.scope, label)) {
    labelToUpdate = capitalizeFirstLetter(label);
  } else {
    labelToUpdate = label;
  }

  let modifiedErrors = errors;

  if (errors === 'should be equal to one of the allowed values' && uischema?.options?.enumContext) {
    modifiedErrors = '';
  }

  console.log(`InputBaseControl = ${dirty} input path = ${formInputPath}`);
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
