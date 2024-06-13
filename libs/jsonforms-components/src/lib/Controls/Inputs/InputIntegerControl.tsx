import React from 'react';
import { CellProps, WithClassname, ControlProps, isIntegerControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInput } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { checkFieldValidity } from '../../util/stringUtils';
import {
  onBlurForNumericControl,
  onChangeForNumericControl,
  onKeyPressNumericControl,
} from '../../util/inputControlUtils';

export type GoAInputIntegerProps = CellProps & WithClassname & WithInputProps;

export const GoAInputInteger = (props: GoAInputIntegerProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const InputValue = data && data !== undefined ? data : '';
  const clonedSchema = JSON.parse(JSON.stringify(schema));
  const StepValue = clonedSchema.multipleOf ? clonedSchema.multipleOf : 0;
  const MinValue = clonedSchema.minimum ? clonedSchema.minimum : '';
  const MaxValue = clonedSchema.exclusiveMaximum ? clonedSchema.exclusiveMaximum : '';
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const errorsFormInput = checkFieldValidity(props as ControlProps);
  if (uischema?.options?.isStepperReview) {
    return <div>{InputValue}</div>;
  }
  return (
    <GoAInput
      type="number"
      error={errorsFormInput.length > 0}
      width="100%"
      disabled={!enabled}
      readonly={readOnly}
      value={InputValue}
      step={StepValue}
      min={MinValue}
      max={MaxValue}
      placeholder={placeholder}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onKeyPress={(name: string, value: string, key: string) => {
        onKeyPressNumericControl({
          name,
          value,
          key,
          controlProps: props as ControlProps,
        });
      }}
      onBlur={(name: string, value: string) => {
        onBlurForNumericControl({
          name,
          value,
          controlProps: props as ControlProps,
        });
      }}
      onChange={(name: string, value: string) => {
        onChangeForNumericControl({
          name,
          value,
          controlProps: props as ControlProps,
        });
      }}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoAIntegerControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoAInputInteger} />;

export const GoAIntegerControlTester: RankedTester = rankWith(2, isIntegerControl);
export const GoAInputIntegerControl = withJsonFormsControlProps(GoAIntegerControl);
