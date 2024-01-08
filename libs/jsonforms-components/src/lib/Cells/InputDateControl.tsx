import React from 'react';
import { CellProps, WithClassname, ControlProps, isDateControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputDate } from '@abgov/react-components-new';
import { WithInputProps } from '../Controls/Inputs/type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from '../Controls/Inputs/InputBaseControl';
type GoAInputDateProps = CellProps & WithClassname & WithInputProps;

export const GoADateInput = (props: GoAInputDateProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  return (
    <GoAInputDate
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={data}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onChange={(name, value) => handleChange(path, value)}
    />
  );
};

export const GoADateControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoADateInput} />;

export const GoADateControlTester: RankedTester = rankWith(1, isDateControl);
export const GoAInputDateControl = withJsonFormsControlProps(GoADateControl);
