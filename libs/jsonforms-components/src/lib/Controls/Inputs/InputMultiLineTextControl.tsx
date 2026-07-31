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
import { GoabTextArea } from '@abgov/react-components-ds1';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { onChangeForInputControl } from '../../util/inputControlUtils';
import {
  GoabTextAreaOnBlurDetail,
  GoabTextAreaOnChangeDetail,
  GoabTextAreaOnKeyPressDetail,
} from '@abgov/ui-components-common';
import { useDebouncedCommit } from '../../util/useDebouncedCommit';
export type GoabInputMultiLineTextProps = CellProps & WithClassname & WithInputProps;

export const MultiLineText = (props: GoabInputMultiLineTextProps): JSX.Element => {
  const { data, config, id, enabled, uischema, path, schema, label, isVisited, errors, setIsVisited } = props;

  const {
    value: textAreaValue,
    setValue: setTextAreaValue,
    flush: flushTextArea,
  } = useDebouncedCommit<string>(data || '', (value) =>
    onChangeForInputControl({ name: '', value, controlProps: props as ControlProps }),
  );

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  const width = uischema?.options?.componentProps?.width ?? '100%';
  const autoCapitalize =
    uischema?.options?.componentProps?.autoCapitalize === true || uischema?.options?.autoCapitalize === true;
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const textAreaName = `${label || path}-text-area` || '';

  const applyCapitalization = (value: string) => (autoCapitalize ? value.toUpperCase() : value);

  const markVisited = () => {
    if (isVisited === false && setIsVisited) {
      setIsVisited();
    }
  };

  const txtAreaComponent = (
    <GoabTextArea
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
      // The component raises _change from its input event, so unlike _keyPress (keyup) this also
      // covers pasting, IME composition and held-key repeats.
      onChange={(detail: GoabTextAreaOnChangeDetail) => {
        setTextAreaValue(applyCapitalization(detail.value));
        markVisited();
      }}
      onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
        setTextAreaValue(applyCapitalization(detail.value));
        markVisited();
      }}
      onBlur={(detail: GoabTextAreaOnBlurDetail) => {
        setTextAreaValue(applyCapitalization(detail.value));
        flushTextArea();
        markVisited();
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
