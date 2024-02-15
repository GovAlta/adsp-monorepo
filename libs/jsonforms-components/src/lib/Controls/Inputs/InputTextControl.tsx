import React from 'react';
import { CellProps, WithClassname, ControlProps, isStringControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInput } from '@abgov/react-components-new';
import { WithInputProps, WithRequiredProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl, WithKeyPressInput } from './InputBaseControl';

type GoAInputTextProps = CellProps & WithClassname & WithInputProps & WithRequiredProps & WithKeyPressInput;

export const isGoAError = (props: GoAInputTextProps) => {
  const { errors, data, required } = props;
  let isError = false;

  if (required && data === undefined && errors.length === 0) {
    isError = false;
  } else if (required && data !== undefined && errors.length === 0) {
    isError = false;
  } else {
    isError = true;
  }
  if (required && data !== undefined && data === '') {
    isError = true;
  }

  return isError;
};

let keyPressCode = '';

export const GoAInputText = (props: GoAInputTextProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, errors, config, id, enabled, uischema, isValid, required, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  return (
    <GoAInput
      error={isGoAError(props)}
      type={appliedUiSchemaOptions.format === 'password' ? 'password' : 'text'}
      disabled={!enabled}
      value={data}
      width={'100%'}
      placeholder={placeholder}
      // maxLength={appliedUiSchemaOptions?.maxLength}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onChange={(name: string, value: string) => {
        handleChange(path, value);
      }}
      onKeyPress={(name: string, value: string, key: string) => {
        keyPressCode = key;
        handleChange(path, value);
      }}
    />
  );
};

export const GoATextControl = (props: ControlProps) => (
  <GoAInputBaseControl {...props} keyPressCode={keyPressCode} input={GoAInputText} />
);

export const GoATextControlTester: RankedTester = rankWith(1, isStringControl);
export const GoAInputTextControl = withJsonFormsControlProps(GoATextControl);
