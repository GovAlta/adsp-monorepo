import React, { useEffect } from 'react';
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
import { GoATextArea } from '@abgov/react-components';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { onKeyPressForTextControl, onChangeForInputControl } from '../../util/inputControlUtils';

export type GoAInputMultiLineTextProps = CellProps & WithClassname & WithInputProps;

export const MultiLineText = (props: GoAInputMultiLineTextProps): JSX.Element => {
  const { data, config, id, enabled, uischema, path, schema, label, isVisited, errors, setIsVisited } = props;
  const { required } = props as ControlProps;
  const [textAreaValue, _] = React.useState<string>(data);

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  const width = uischema?.options?.componentProps?.width ?? '100%';
  const autoCapitalize =
    uischema?.options?.componentProps?.autoCapitalize === true || uischema?.options?.autoCapitalize === true;
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const textAreaName = `${label || path}-text-area` || '';

  const txtAreaComponent = (
    <GoATextArea
      error={isVisited && errors.length > 0}
      value={textAreaValue}
      disabled={!enabled}
      readOnly={readOnly}
      placeholder={placeholder}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      name={textAreaName}
      width={width}
      // Note: Paul Jan-09-2023. The latest ui-component come with the maxCount. We need to uncomment the following line when the component is updated
      // maxCount={schema.maxLength || 256}
      onKeyPress={(name: string, value: string, key: string) => {
        const newValue = autoCapitalize ? value.toUpperCase() : value;

        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }
        if (value.length === 0 || (required && errors.length === 0 && value.length > 0)) {
          onKeyPressForTextControl({
            name,
            value: newValue,
            key,
            controlProps: props as ControlProps,
          });
        }

        onChangeForInputControl({
          name,
          value: newValue,
          controlProps: props as ControlProps,
        });
      }}
      onChange={(name: string, value: string) => {
        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }
      }}
      {...uischema?.options?.componentProps}
    />
  );

  return txtAreaComponent;
};

export const MultiLineTextControlInput = (props: ControlProps) => (
  <GoAInputBaseControl {...props} input={MultiLineText} />
);

export const MultiLineTextControlTester: RankedTester = rankWith(3, and(isStringControl, optionIs('multi', true)));
export const MultiLineTextControl = withJsonFormsControlProps(MultiLineTextControlInput);
