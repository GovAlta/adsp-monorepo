import React, { useState } from 'react';
import { CellProps, WithClassname, ControlProps, isStringControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInput } from '@abgov/react-components-new';
import { KeyPressPathPair, WithInputProps, WithKeyPressInput, WithRequiredProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';

type GoAInputTextProps = CellProps & WithClassname & WithInputProps & WithRequiredProps & WithKeyPressInput;

export const isGoAError = (props: GoAInputTextProps, keyPressCode: KeyPressPathPair) => {
  const { data, errors, required, path } = props;
  if (!required) return false;

  let isError = false;

  if (data === undefined && errors.length === 0 && keyPressCode.path === path) {
    isError = false;
  } else if (data !== undefined && errors.length === 0 && keyPressCode.path !== path) {
    isError = false;
  } else if (data !== undefined && errors.length > 0 && keyPressCode.path !== path) {
    isError = true;
  }

  if ((data !== undefined && data === '') || errors.length > 0) {
    isError = true;
  }

  return isError;
};

let keyPressCode: KeyPressPathPair = { keyPressCode: '', path: '' };

export const GoAInputText = (props: GoAInputTextProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, errors, config, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  return (
    <GoAInput
      error={isGoAError(props, keyPressCode)}
      type={appliedUiSchemaOptions.format === 'password' ? 'password' : 'text'}
      disabled={!enabled}
      value={data}
      width={'100%'}
      placeholder={placeholder}
      // maxLength={appliedUiSchemaOptions?.maxLength}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onChange={(name: string, value: string) => {
        if (keyPressCode.keyPressCode !== 'Tab' && keyPressCode.keyPressCode !== 'Shift') {
          handleChange(path, value);
        }
      }}
      onKeyPress={(name: string, value: string, key: string) => {
        // Need this to pass down what keypress was done and the control id, so that we can detect
        // what key presses were done to what control for simple validation.
        keyPressCode = { keyPressCode: key, path: props.path };

        if (keyPressCode.keyPressCode !== 'Tab' && keyPressCode.keyPressCode !== 'Shift') {
          handleChange(path, value);
        }
      }}
    />
  );
};

export const GoATextControl = (props: ControlProps & WithKeyPressInput) => (
  <GoAInputBaseControl {...props} keyPressCode={keyPressCode} input={GoAInputText} />
);

export const GoATextControlTester: RankedTester = rankWith(1, isStringControl);
export const GoAInputTextControl = withJsonFormsControlProps(GoATextControl);
