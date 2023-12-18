import React from 'react';
import {
  CellProps,
  Formatted,
  WithClassname,
  ControlProps,
  isStringControl,
  RankedTester,
  rankWith,
} from '@jsonforms/core';
import { GoAInput } from '@abgov/react-components-new';
import { useDebouncedChange } from '@jsonforms/material-renderers';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
type GoAInputTextProps = CellProps & WithClassname & WithInputProps;

// eslint-disable-next-line
const eventToValue = (ev: any) => (ev.target.value === '' ? undefined : ev.target.value);

export const GoAInputText = (props: GoAInputTextProps): JSX.Element => {
  const { data, config, className, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const [inputText, onChange, onClear] = useDebouncedChange(handleChange, '', data, path, eventToValue);
  return (
    <GoAInput
      type={appliedUiSchemaOptions.format === 'password' ? 'password' : 'text'}
      value={inputText}
      name={'name'}
      onChange={(name: string, value: string) => handleChange(name, inputText)}
    />
  );
};

export const GoATextControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoAInputText} />;

export const GoATextControlTester: RankedTester = rankWith(1, isStringControl);
export const GoAInputTextControl = withJsonFormsControlProps(GoATextControl);
