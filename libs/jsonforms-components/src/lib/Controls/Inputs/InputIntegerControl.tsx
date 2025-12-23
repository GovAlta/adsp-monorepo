import React from 'react';
import { CellProps, WithClassname, ControlProps, isIntegerControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoabInput } from '@abgov/react-components';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { onBlurForNumericControl, onChangeForNumericControl } from '../../util/inputControlUtils';
import { GoabInputOnChangeDetail, GoabInputOnBlurDetail } from '@abgov/ui-components-common';

export type GoabInputIntegerProps = CellProps & WithClassname & WithInputProps;

export const GoabInputInteger = (props: GoabInputIntegerProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, schema, label, isVisited, errors, setIsVisited } = props;

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const InputValue = data && data !== undefined ? data : '';
  const clonedSchema = JSON.parse(JSON.stringify(schema));
  const StepValue = clonedSchema.multipleOf ? clonedSchema.multipleOf : 0;
  const MinValue = clonedSchema.minimum ? clonedSchema.minimum : '';
  const MaxValue = clonedSchema.exclusiveMaximum ? clonedSchema.exclusiveMaximum : '';
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const width = uischema?.options?.componentProps?.width ?? '100%';

  return (
    <GoabInput
      type="number"
      error={isVisited && errors.length > 0}
      width={width}
      disabled={!enabled}
      readonly={readOnly}
      value={InputValue}
      step={StepValue}
      min={MinValue}
      max={MaxValue}
      placeholder={placeholder}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onBlur={(detail: GoabInputOnBlurDetail) => {
        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }
        onBlurForNumericControl({
          name: detail.name,
          value: detail.value,
          controlProps: props as ControlProps,
        });
      }}
      onChange={(detail: GoabInputOnChangeDetail) => {
        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }
        onChangeForNumericControl({
          name: detail.name,
          value: detail.value,
          controlProps: props as ControlProps,
        });
      }}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoAIntegerControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoabInputInteger} />;

export const GoAIntegerControlTester: RankedTester = rankWith(2, isIntegerControl);
export const GoAInputIntegerControl = withJsonFormsControlProps(GoAIntegerControl);
