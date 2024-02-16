import React from 'react';
import { CellProps, WithClassname, ControlProps, isIntegerControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputNumber } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
type GoAInputIntegerProps = CellProps & WithClassname & WithInputProps;

let additionalData: number;
export const GoAInputInteger = (props: GoAInputIntegerProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, errors, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const inputValue = data ? data : 0;
  const clonedSchema = JSON.parse(JSON.stringify(schema));
  const StepValue = clonedSchema.multipleOf ? clonedSchema.multipleOf : 0;
  const MinValue = clonedSchema.min ? clonedSchema.min : 0;
  const MaxValue = clonedSchema.max ? clonedSchema.max : 99;
  const getValueToValidate = () => {
    if (data === undefined) {
      return inputValue;
    }
    return data;
  };

  additionalData = getValueToValidate();
  return (
    <GoAInputNumber
      error={errors.length > 0}
      width="100%"
      disabled={!enabled}
      value={inputValue}
      step={StepValue}
      min={MinValue}
      max={MaxValue}
      placeholder={placeholder}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onChange={(name, value) => handleChange(path, value)}
    />
  );
};

export const GoAIntegerControl = (props: ControlProps) => (
  <GoAInputBaseControl {...props} additionalData={additionalData} input={GoAInputInteger} />
);

export const GoAIntegerControlTester: RankedTester = rankWith(2, isIntegerControl);
export const GoAInputIntegerControl = withJsonFormsControlProps(GoAIntegerControl);
