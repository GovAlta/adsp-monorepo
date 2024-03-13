import React from 'react';
import { isBooleanControl, RankedTester, rankWith, ControlProps, isDescriptionHidden } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoACheckbox } from '@abgov/react-components-new';
import { GoAInputBaseControl } from './InputBaseControl';
import { checkFieldValidity } from '../../util/stringUtils';

export const BooleanComponent = ({
  data,
  visible,
  enabled,
  uischema,
  handleChange,
  path,
  config,
  label,
  required,
  errors,
  description,
}: ControlProps) => {
  const appliedUiSchemaOptions = { ...config, ...uischema.options };

  const showDescription = !isDescriptionHidden(
    visible,
    description,
    false,
    appliedUiSchemaOptions.showUnfocusedDescription
  );
  const errorsFormInput = checkFieldValidity({
    data,
    uischema,
    label,
    required,
    errors,
  } as ControlProps);

  let text = label + (required ? ' (required)' : '');

  if (label && description) {
    text = description;
    if (required) {
      text = `${description} ` + (required ? ' (required)' : '');
    }
  }
  const readOnly = uischema?.options?.componentProps?.readOnly === true;
  const onChangeHandler = (name: string, checked: boolean, value: string, readOnly: boolean) => {
    if (readOnly) return;
    handleChange(path, checked);
  };

  return (
    <GoACheckbox
      error={errorsFormInput.length > 0}
      testId={`${path}-checkbox-test-id`}
      disabled={!enabled}
      text={text}
      name={`${path}`}
      checked={data}
      onChange={(name: string, checked: boolean, value: string) => {
        onChangeHandler(name, checked, value, readOnly);
      }}
      {...uischema?.options?.componentProps}
    ></GoACheckbox>
  );
};
export const BooleanControl = (props: ControlProps) => (
  <GoAInputBaseControl {...{ ...props, noLabel: true }} input={BooleanComponent} />
);

export const GoABooleanControlTester: RankedTester = rankWith(2, isBooleanControl);
export const GoABooleanControl = withJsonFormsControlProps(BooleanControl);
