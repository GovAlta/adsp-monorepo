import React from 'react';
import { CellProps, WithClassname, ControlProps, isNumberControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInput } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { checkFieldValidity } from '../../util/stringUtils';
import { isNotKeyPressTabOrShift, isRequiredAndHasNoData } from '../../util/inputControlUtils';

export type GoAInputNumberProps = CellProps & WithClassname & WithInputProps;

export const GoANumberInput = (props: GoAInputNumberProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const InputValue = data && data !== undefined ? data : '';
  const clonedSchema = JSON.parse(JSON.stringify(schema));
  const StepValue = clonedSchema.multipleOf ? clonedSchema.multipleOf : 0.01;
  const MinValue = clonedSchema.minimum ? clonedSchema.minimum : '';
  const MaxValue = clonedSchema.exclusiveMaximum ? clonedSchema.exclusiveMaximum : '';
  const errorsFormInput = checkFieldValidity(props as ControlProps);

  return (
    <GoAInput
      type="number"
      error={errorsFormInput.length > 0}
      disabled={!enabled}
      value={InputValue}
      placeholder={placeholder}
      step={StepValue}
      min={MinValue}
      max={MaxValue}
      width="100%"
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onKeyPress={(name: string, value: string, key: string) => {
        if (isNotKeyPressTabOrShift(key)) {
          let newValue: string | number = '';
          if (value !== '') {
            newValue = +value;
          }
          handleChange(path, newValue);
        }
      }}
      onBlur={(name: string, value: string) => {
        if (isRequiredAndHasNoData(props as ControlProps)) {
          let newValue: string | number = '';
          if (value !== '') {
            newValue = +value;
          }
          handleChange(path, newValue);
        }
      }}
      //Dont trigger the handleChange event on the onChange event as it will cause
      //issue with the error message from displaying, use keyPress or the onBlur event instead
      onChange={(name: string, value: string) => {}}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoANumberControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoANumberInput} />;

export const GoANumberControlTester: RankedTester = rankWith(2, isNumberControl);
export const GoAInputNumberControl = withJsonFormsControlProps(GoANumberControl);
