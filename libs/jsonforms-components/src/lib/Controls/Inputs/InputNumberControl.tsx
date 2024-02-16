import React from 'react';
import { CellProps, WithClassname, ControlProps, isNumberControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputNumber } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
type GoAInputNumberProps = CellProps & WithClassname & WithInputProps;

let additionalData: number;
export const GoANumberInput = (props: GoAInputNumberProps): JSX.Element => {
  // eslint-disable-next-line
  const getValueToValidate = () => {
    if (data === undefined) {
      return inputValue;
    }
    return data;
  };

  const { data, config, id, enabled, uischema, isValid, errors, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const inputValue: number = data ? data : 0.0;
  const clonedSchema = JSON.parse(JSON.stringify(schema));
  const StepValue = clonedSchema.multipleOf ? clonedSchema.multipleOf : 0.01;
  const MinValue = clonedSchema.min ? clonedSchema.min : 0;
  const MaxValue = clonedSchema.max ? clonedSchema.max : 99;

  additionalData = getValueToValidate();

  return (
    <GoAInputNumber
      error={isNaN(getValueToValidate())}
      disabled={!enabled}
      value={inputValue}
      placeholder={placeholder}
      step={StepValue}
      min={MinValue}
      max={MaxValue}
      width="100%"
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onChange={(name, value) => handleChange(path, value)}
    />
  );
};
export const GoANumberControl = (props: ControlProps) => (
  <GoAInputBaseControl {...props} additionalData={additionalData} input={GoANumberInput} />
);

export const GoANumberControlTester: RankedTester = rankWith(2, isNumberControl);
export const GoAInputNumberControl = withJsonFormsControlProps(GoANumberControl);
