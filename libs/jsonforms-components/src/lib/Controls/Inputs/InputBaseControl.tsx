import React, { useContext, useEffect } from 'react';
import { GoAFormItem } from '@abgov/react-components-new';
import { ControlProps } from '@jsonforms/core';
import { Hidden } from '@mui/material';
import { FormFieldWrapper } from './style-component';
import { checkFieldValidity, getLabelText } from '../../util/stringUtils';
import { StepInputStatus, StepperContext } from '../FormStepper/StepperContext';
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
  const { uischema, visible, label, input, required } = props;
  const InnerComponent = input;
  const labelToUpdate: string = getLabelText(uischema.scope, label || '');

  let modifiedErrors = checkFieldValidity(props as ControlProps);

  if (modifiedErrors === 'should be equal to one of the allowed values' && uischema?.options?.enumContext) {
    modifiedErrors = '';
  }

  const getStatus = (props: ControlProps & WithInput, value: unknown): StepInputStatus => {
    return {
      id: props.id,
      value: value,
      required: props.required || false,
      type: props.schema.type,
      step: stepperContext.stepId,
    };
  };

  const stepperContext = useContext(StepperContext);
  const handlerWithStepperUpdate = (path: string, value: unknown) => {
    stepperContext.updateStatus(getStatus(props, value));
    props.handleChange(path, value);
  };
  const modifiedProps = { ...props, handleChange: handlerWithStepperUpdate };

  useEffect(() => {
    if (!stepperContext.isInitialized(props.id)) {
      const status = getStatus(props, props.data);
      stepperContext.updateStatus(status);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Hidden xsUp={!visible}>
      <FormFieldWrapper>
        <GoAFormItem
          requirement={required ? 'required' : undefined}
          error={modifiedErrors}
          label={props?.noLabel === true ? '' : labelToUpdate}
          helpText={typeof uischema?.options?.help === 'string' ? uischema?.options?.help : ''}
        >
          <InnerComponent {...modifiedProps} />
        </GoAFormItem>
      </FormFieldWrapper>
    </Hidden>
  );
};
