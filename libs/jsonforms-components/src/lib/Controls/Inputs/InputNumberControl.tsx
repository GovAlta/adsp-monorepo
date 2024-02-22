import React from 'react';
import { CellProps, WithClassname, ControlProps, isNumberControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputNumber } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { getErrorsToDisplay } from '../../util/stringUtils';
type GoAInputNumberProps = CellProps & WithClassname & WithInputProps;

export const GoANumberInput = (props: GoAInputNumberProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, errors, config, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;
  const { required } = props as ControlProps;

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const InputValue = data ? data : 0.0;
  const clonedSchema = JSON.parse(JSON.stringify(schema));
  const StepValue = clonedSchema.multipleOf ? clonedSchema.multipleOf : 0.01;
  const MinValue = clonedSchema.min ? clonedSchema.min : 0;
  const MaxValue = clonedSchema.max ? clonedSchema.max : 99;
  const errorsFormInput = getErrorsToDisplay(props as ControlProps);

  return (
    <GoAInputNumber
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
      onKeyPress={(name: string, value: number, key: string) => {
        if (!(key === 'Tab' || key === 'Shift')) {
          handleChange(path, value);
        }
      }}
      onBlur={(name: string, value: number) => {
        handleChange(name, value);
      }}
      onChange={(name, value) => handleChange(path, value)}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoANumberControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoANumberInput} />;

export const GoANumberControlTester: RankedTester = rankWith(2, isNumberControl);
export const GoAInputNumberControl = withJsonFormsControlProps(GoANumberControl);
