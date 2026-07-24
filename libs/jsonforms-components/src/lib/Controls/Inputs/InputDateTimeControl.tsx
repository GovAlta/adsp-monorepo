import React from 'react';
import { CellProps, WithClassname, ControlProps, isDateTimeControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoabInput } from '@abgov/react-components-ds1';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { onBlurForDateControl, onChangeForDateTimeControl } from '../../util/inputControlUtils';
import { GoabInputOnChangeDetail, GoabInputOnBlurDetail } from '@abgov/ui-components-common';

export type GoAInputDateTimeProps = CellProps & WithClassname & WithInputProps;

export const toDateTimeLocalInputValue = (value: unknown): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (part: number) => String(part).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}`;
};

export const GoADateTimeInput = (props: GoAInputDateTimeProps): JSX.Element => {
  const { data, config, id, enabled, uischema, isVisited, errors, label, setIsVisited } = props;

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const width = uischema?.options?.componentProps?.width ?? '100%';

  return (
    <GoabInput
      type="datetime-local"
      error={isVisited && errors.length > 0}
      width={width}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={toDateTimeLocalInputValue(data)}
      step={1}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      disabled={!enabled}
      readonly={readOnly}
      onChange={(detail: GoabInputOnChangeDetail) => {
        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }
        onChangeForDateTimeControl({
          name: detail.name,
          value: detail.value,
          controlProps: props as ControlProps,
        });
      }}
      onBlur={(detail: GoabInputOnBlurDetail) => {
        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }

        onBlurForDateControl({
          name: detail.name,
          value: detail.value,
          controlProps: props as ControlProps,
        });
      }}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoADateTimeControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoADateTimeInput} />;

export const GoADateTimeControlTester: RankedTester = rankWith(2, isDateTimeControl);
export const GoAInputDateTimeControl = withJsonFormsControlProps(GoADateTimeControl);
