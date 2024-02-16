import React from 'react';
import {
  CellProps,
  WithClassname,
  ControlProps,
  isStringControl,
  RankedTester,
  rankWith,
  and,
  optionIs,
} from '@jsonforms/core';
import { GoATextArea } from '@abgov/react-components-new';
import { KeyPressPathPair, WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { isGoAError } from './InputTextControl';
type GoAInputTextProps = CellProps & WithClassname & WithInputProps;

let keyPressCode: KeyPressPathPair = { keyPressCode: '', path: '' };
export const MultiLineText = (props: GoAInputTextProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  return (
    <GoATextArea
      error={isGoAError(props, keyPressCode)}
      value={data}
      disabled={!enabled}
      placeholder={placeholder}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      name={`${label || path}-text-area`}
      width={'100%'}
      // Note: Paul Jan-09-2023. The latest ui-component come with the maxCount. We need to uncomment the following line when the component is updated
      // maxCount={schema.maxLength || 256}
      onKeyPress={(name: string, value: string, key: string) => {
        // Need this to pass down what keypress was done and the control id, so that we can detect
        // what key presses were done to what control for simple validation.
        keyPressCode = { keyPressCode: key, path: props.path };
        if (keyPressCode.keyPressCode !== 'Tab' && keyPressCode.keyPressCode !== 'Shift') {
          handleChange(path, value);
        }
      }}
      // eslint-disable-next-line
      onChange={() => {}}
    />
  );
};

export const MultiLineTextControlInput = (props: ControlProps) => (
  <GoAInputBaseControl {...props} input={MultiLineText} />
);

export const MultiLineTextControlTester: RankedTester = rankWith(3, and(isStringControl, optionIs('multi', true)));
export const MultiLineTextControl = withJsonFormsControlProps(MultiLineTextControlInput);
