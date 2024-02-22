import React from 'react';
import { CellProps, WithClassname, ControlProps, isStringControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInput, GoAInputDate, GoAInputTime, GoAInputDateTime } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
type GoAInputTextProps = CellProps & WithClassname & WithInputProps;

export const GoAInputText = (props: GoAInputTextProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  return (
    <GoAInput
      type={appliedUiSchemaOptions.format === 'password' ? 'password' : 'text'}
      disabled={!enabled}
      value={data}
      width={'100%'}
      placeholder={placeholder}
      // maxLength={appliedUiSchemaOptions?.maxLength}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onChange={(name: string, value: string) => handleChange(path, value)}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoATextControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoAInputText} />;

export const GoATextControlTester: RankedTester = rankWith(1, isStringControl);
export const GoAInputTextControl = withJsonFormsControlProps(GoATextControl);
