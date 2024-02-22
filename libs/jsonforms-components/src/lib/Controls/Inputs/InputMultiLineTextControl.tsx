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
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { getErrorsToDisplay } from '../../util/stringUtils';
type GoAInputTextProps = CellProps & WithClassname & WithInputProps;

export const MultiLineText = (props: GoAInputTextProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, path, handleChange, schema, label } = props;

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const errorsFormInput = getErrorsToDisplay(props as ControlProps);

  return (
    <GoATextArea
      error={errorsFormInput.length > 0}
      value={data}
      disabled={!enabled}
      placeholder={placeholder}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      name={`${label || path}-text-area`}
      width={'100%'}
      // Note: Paul Jan-09-2023. The latest ui-component come with the maxCount. We need to uncomment the following line when the component is updated
      // maxCount={schema.maxLength || 256}

      onKeyPress={(name: string, value: string, key: string) => {
        if (!(key === 'Tab' || key === 'Shift')) {
          handleChange(path, value);
        }
      }}
      // eslint-disable-next-line
      onChange={() => {}}
      {...uischema?.options?.componentProps}
    />
  );
};

export const MultiLineTextControlInput = (props: ControlProps) => (
  <GoAInputBaseControl {...props} input={MultiLineText} />
);

export const MultiLineTextControlTester: RankedTester = rankWith(3, and(isStringControl, optionIs('multi', true)));
export const MultiLineTextControl = withJsonFormsControlProps(MultiLineTextControlInput);
