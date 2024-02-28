import React from 'react';
import { CellProps, WithClassname, ControlProps, isNumberControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInput } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { getErrorsToDisplay } from '../../util/stringUtils';
type GoAInputNumberProps = CellProps & WithClassname & WithInputProps;

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
  const errorsFormInput = getErrorsToDisplay(props as ControlProps);

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
        if (!(key === 'Tab' || key === 'Shift')) {
          let newValue: string | number = '';
          if (value !== '') {
            newValue = +value;
          }
          handleChange(path, newValue);
        }
      }}
      onBlur={(name: string, value: string) => {
        let newValue: string | number = '';
        if (value !== '') {
          newValue = +value;
        }
        handleChange(path, newValue);
      }}
      onChange={(name: string, value: string) => {
        let newValue: string | number = '';
        if (value !== '') {
          newValue = +value;
        }

        handleChange(path, newValue);
      }}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoANumberControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoANumberInput} />;

export const GoANumberControlTester: RankedTester = rankWith(2, isNumberControl);
export const GoAInputNumberControl = withJsonFormsControlProps(GoANumberControl);
