import React from 'react';
import { CellProps, WithClassname, ControlProps, isDateTimeControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputDateTime } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
type GoAInputDateTimeProps = CellProps & WithClassname & WithInputProps;

export const GoADateTimeInput = (props: GoAInputDateTimeProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  return (
    <GoAInputDateTime
      width="100%"
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={data ? new Date(data).toISOString() : ''}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      disabled={!enabled}
      onChange={(name, value) => {
        value = new Date(value).toISOString();
        handleChange(path, value);
      }}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoADateTimeControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoADateTimeInput} />;

export const GoADateTimeControlTester: RankedTester = rankWith(2, isDateTimeControl);
export const GoAInputDateTimeControl = withJsonFormsControlProps(GoADateTimeControl);
