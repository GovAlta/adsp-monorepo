import React from 'react';
import { CellProps, WithClassname, ControlProps, isDateTimeControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputDateTime } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { checkFieldValidity } from '../../util/stringUtils';
import {
  onBlurForDateControl,
  onChangeForDateTimeControl,
  onKeyPressForDateControl,
} from '../../util/inputControlUtils';

export type GoAInputDateTimeProps = CellProps & WithClassname & WithInputProps;

export const GoADateTimeInput = (props: GoAInputDateTimeProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, path, errors, handleChange, schema, label } = props;

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const width = uischema?.options?.componentProps?.width ?? '100%';

  return (
    <GoAInputDateTime
      error={checkFieldValidity(props as ControlProps).length > 0}
      width={width}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={data ? new Date(data).toISOString() : ''}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      disabled={!enabled}
      readonly={readOnly}
      onChange={(name, value: Date | string) => {
        onChangeForDateTimeControl({
          name,
          value,
          controlProps: props as ControlProps,
        });
      }}
      onKeyPress={(name: string, value: string, key: string) => {
        onKeyPressForDateControl({
          name,
          value,
          key,
          controlProps: props as ControlProps,
        });
      }}
      onBlur={(name: string, value: string) => {
        onBlurForDateControl({
          name,
          value,
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
