import React from 'react';
import { CellProps, WithClassname, ControlProps, isDateControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputDate } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
type GoAInputDateProps = CellProps & WithClassname & WithInputProps;

export const GoADateInput = (props: GoAInputDateProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  return (
    <GoAInputDate
      width="100%"
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={data ? new Date(data).toISOString().substring(0, 10) : ''}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onChange={(name, value) => {
        value = new Date(value).toISOString().substring(0, 10);
        handleChange(path, value);
      }}
    />
  );
};

export const GoADateControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoADateInput} />;

export const GoADateControlTester: RankedTester = rankWith(4, isDateControl);
export const GoAInputDateControl = withJsonFormsControlProps(GoADateControl);
