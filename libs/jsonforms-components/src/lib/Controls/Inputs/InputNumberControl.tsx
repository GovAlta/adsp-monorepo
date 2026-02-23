import React, { useState, useEffect } from 'react';
import { CellProps, WithClassname, ControlProps, isNumberControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoabInput } from '@abgov/react-components';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { onBlurForNumericControl, onChangeForNumericControl } from '../../util/inputControlUtils';
import { GoabInputOnChangeDetail, GoabInputOnBlurDetail, GoabInputOnKeyPressDetail } from '@abgov/ui-components-common';
import { useDebounce } from '../../util/useDebounce';

export type GoAInputNumberProps = CellProps & WithClassname & WithInputProps;

export const GoANumberInput = (props: GoAInputNumberProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, schema, label, isVisited, errors, setIsVisited } = props;

  const InputValue = data && data !== undefined ? data : '';
  const [localValue, setLocalValue] = useState<string | number>(InputValue);

  const debouncedValue = useDebounce(localValue, 800);

  useEffect(() => {
    const newValue = data !== undefined ? data : '';
    setLocalValue(newValue);
  }, [data]);

  /* istanbul ignore next */
  useEffect(() => {
    // Only sync if debouncedValue differs from data and is not initial empty state
    if (debouncedValue !== data && (debouncedValue !== '' || data !== undefined)) {
      onChangeForNumericControl({
        name: '',
        value: String(debouncedValue),
        controlProps: props as ControlProps,
      });
    }
  }, [debouncedValue]);
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const clonedSchema = JSON.parse(JSON.stringify(schema));
  const StepValue = clonedSchema.multipleOf ? clonedSchema.multipleOf : 0.01;
  const MinValue = clonedSchema.minimum ? clonedSchema.minimum : '';
  const MaxValue = clonedSchema.exclusiveMaximum ? clonedSchema.exclusiveMaximum : '';
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const width = uischema?.options?.componentProps?.width ?? '100%';

  return (
    <GoabInput
      type="number"
      error={isVisited && errors.length > 0}
      disabled={!enabled}
      readonly={readOnly}
      value={localValue}
      placeholder={placeholder}
      step={StepValue}
      min={MinValue}
      max={MaxValue}
      width={width}
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
        setLocalValue(detail.value);

        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }
      }}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoANumberControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoANumberInput} />;

export const GoANumberControlTester: RankedTester = rankWith(2, isNumberControl);
export const GoAInputNumberControl = withJsonFormsControlProps(GoANumberControl);
