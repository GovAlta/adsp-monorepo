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
import { GoabTextArea } from '@abgov/react-components';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { onChangeForInputControl } from '../../util/inputControlUtils';
import {
  GoabTextAreaOnBlurDetail,
  GoabTextAreaOnChangeDetail,
  GoabTextAreaOnKeyPressDetail,
} from '@abgov/ui-components-common';
import { useDebounce } from '../../util/useDebounce';
export type GoabInputMultiLineTextProps = CellProps & WithClassname & WithInputProps;

const DEBOUNCE_DELAY = 550;
export const MultiLineText = (props: GoabInputMultiLineTextProps): JSX.Element => {
  const { data, config, id, enabled, uischema, path, schema, label, isVisited, errors, setIsVisited } = props;

  const [textAreaValue, setTextAreaValue] = React.useState<string>(data || '');

  const debouncedValue = useDebounce(textAreaValue, DEBOUNCE_DELAY);

  useEffect(() => {
    setTextAreaValue(data || '');
  }, [data]);

  /* istanbul ignore next */
  useEffect(() => {
    if (debouncedValue !== data && (debouncedValue !== '' || data !== undefined)) {
      onChangeForInputControl({
        name: '',
        value: debouncedValue,
        controlProps: props as ControlProps,
      });
    }
  }, [debouncedValue]);

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  const width = uischema?.options?.componentProps?.width ?? '100%';
  const autoCapitalize =
    uischema?.options?.componentProps?.autoCapitalize === true || uischema?.options?.autoCapitalize === true;
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const textAreaName = `${label || path}-text-area` || '';

  const txtAreaComponent = (
    <GoabTextArea
      error={isVisited && errors.length > 0}
      value={debouncedValue}
      disabled={!enabled}
      readOnly={readOnly}
      placeholder={placeholder}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      name={textAreaName}
      width={width}
      // Note: Paul Jan-09-2023. The latest ui-component come with the maxCount. We need to uncomment the following line when the component is updated
      // maxCount={schema.maxLength || 256}
      onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
        const newValue = autoCapitalize ? detail.value.toUpperCase() : detail.value;

        setTextAreaValue(newValue);

        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }
      }}
      onBlur={(detail: GoabTextAreaOnBlurDetail) => {
        const newValue = autoCapitalize ? detail.value.toUpperCase() : detail.value;

        setTextAreaValue(newValue);

        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }
      }}
      onChange={(detail: GoabTextAreaOnChangeDetail) => {}}
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
