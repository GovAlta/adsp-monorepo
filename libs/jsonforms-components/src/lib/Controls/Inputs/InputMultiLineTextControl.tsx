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
import { checkFieldValidity } from '../../util/stringUtils';
import { onKeyPressForTextControl } from '../../util/inputControlUtils';
export type GoAInputMultiLineTextProps = CellProps & WithClassname & WithInputProps;

export const MultiLineText = (props: GoAInputMultiLineTextProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, path, handleChange, schema, label } = props;

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const errorsFormInput = checkFieldValidity(props as ControlProps);
  const autoCapitalize =
    uischema?.options?.componentProps?.autoCapitalize === true || uischema?.options?.autoCapitalize === true;
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;

  return (
    <GoATextArea
      error={errorsFormInput.length > 0}
      value={data}
      disabled={!enabled}
      readOnly={readOnly}
      placeholder={placeholder}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      name={`${label || path}-text-area`}
      width={'100%'}
      // Note: Paul Jan-09-2023. The latest ui-component come with the maxCount. We need to uncomment the following line when the component is updated
      // maxCount={schema.maxLength || 256}
      onKeyPress={(name: string, value: string, key: string) => {
        onKeyPressForTextControl({
          name,
          value: autoCapitalize ? value.toUpperCase() : value,
          key,
          controlProps: props as ControlProps,
        });
      }}
      // Dont use handleChange in the onChange event, use the keyPress or onBlur.
      // If you use it onChange along with keyPress event it will cause a
      // side effect that causes the validation to render when it shouldnt.
      onChange={(name, value: string) => {}}
      {...uischema?.options?.componentProps}
    />
  );
};

export const MultiLineTextControlInput = (props: ControlProps) => (
  <GoAInputBaseControl {...props} input={MultiLineText} />
);

export const MultiLineTextControlTester: RankedTester = rankWith(3, and(isStringControl, optionIs('multi', true)));
export const MultiLineTextControl = withJsonFormsControlProps(MultiLineTextControlInput);
