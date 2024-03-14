import React from 'react';
import { CellProps, WithClassname, ControlProps, isDateTimeControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputDateTime } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { checkFieldValidity, isValidDate } from '../../util/stringUtils';
import {
  isRequiredAndHasNoData,
  onBlurForDateControl,
  onChangeForDateControl,
  onChangeForDateTimeControl,
  onKeyPressForDateControl,
} from '../../util/inputControlUtils';

export type GoAInputDateTimeProps = CellProps & WithClassname & WithInputProps;

export const GoADateTimeInput = (props: GoAInputDateTimeProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, path, errors, handleChange, schema, label } = props;

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };

  return (
    <GoAInputDateTime
      error={checkFieldValidity(props as ControlProps).length > 0}
      width="100%"
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={data ? new Date(data).toISOString() : ''}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      disabled={!enabled}
      onChange={(name, value: Date | string) => {
        onChangeForDateTimeControl({
          name,
          value,
          controlProps: props as ControlProps,
        });
        // if (value && value !== null) {
        //   value = isValidDate(value) ? new Date(value)?.toISOString() : '';
        //   handleChange(path, value);
        // }
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
        // if (isRequiredAndHasNoData(props as ControlProps)) {
        //   value = isValidDate(value) ? new Date(value).toISOString() : '';
        //   handleChange(path, value);
        // }
      }}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoADateTimeControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoADateTimeInput} />;

export const GoADateTimeControlTester: RankedTester = rankWith(2, isDateTimeControl);
export const GoAInputDateTimeControl = withJsonFormsControlProps(GoADateTimeControl);
