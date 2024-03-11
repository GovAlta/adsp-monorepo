import React from 'react';
import { CellProps, WithClassname, ControlProps, isStringControl, RankedTester, rankWith } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInput } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { GoAInputBaseControl } from './InputBaseControl';
import { checkFieldValidity } from '../../util/stringUtils';
import { isNotKeyPressTabOrShift, isRequiredAndHasNoData } from '../../util/inputControlUtils';

type GoAInputTextProps = CellProps & WithClassname & WithInputProps;

export const GoAInputText = (props: GoAInputTextProps): JSX.Element => {
  const { data, config, id, enabled, uischema, isValid, errors, path, handleChange, schema, label } = props;

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';

  const errorsFormInput = checkFieldValidity(props as ControlProps);

  const autoCapitalize =
    uischema?.options?.componentProps?.autoCapitalize === true || uischema?.options?.autoCapitalize === true;

  return (
    <GoAInput
      error={errorsFormInput.length > 0}
      type={appliedUiSchemaOptions.format === 'password' ? 'password' : 'text'}
      disabled={!enabled}
      value={data}
      width={'100%'}
      placeholder={placeholder}
      // maxLength={appliedUiSchemaOptions?.maxLength}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      // Dont use handleChange in the onChange event, use the keyPress or onBlur.
      // If you use it onChange along with keyPress event it will cause a
      // side effect that causes the validation to render when it shouldnt.
      onChange={(name: string, value: string) => {}}
      onKeyPress={(name: string, value: string, key: string) => {
        if (isNotKeyPressTabOrShift(key)) {
          if (autoCapitalize === true) {
            handleChange(path, value.toUpperCase());
          } else {
            handleChange(path, value);
          }
        }
      }}
      onBlur={(name: string, value: string) => {
        if (isRequiredAndHasNoData(props as ControlProps)) {
          if (autoCapitalize) {
            handleChange(path, value.toUpperCase());
          } else {
            handleChange(path, value);
          }
        }
      }}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoATextControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoAInputText} />;

export const GoATextControlTester: RankedTester = rankWith(1, isStringControl);
export const GoAInputTextControl = withJsonFormsControlProps(GoATextControl);
