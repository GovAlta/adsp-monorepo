import React from 'react';
import { isBooleanControl, RankedTester, rankWith, ControlProps, isDescriptionHidden } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { Hidden } from '@mui/material';
import { GoACheckbox } from '@abgov/react-components-new';
import { GoAInputBaseControl } from './InputBaseControl';

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
  description,
}: ControlProps) => {
  const appliedUiSchemaOptions = { ...config, ...uischema.options };

  const showDescription = !isDescriptionHidden(
    visible,
    description,
    false,
    appliedUiSchemaOptions.showUnfocusedDescription
  );
  let text = label;

  if (label && description) {
    text = description;
  }

  if (required) {
    text = `${description} ` + (required ? ' (required)' : '');
  }
  return (
    <GoACheckbox
      testId={`${path}-checkbox-test-id`}
      disabled={!enabled}
      text={text}
      name={`${path}`}
      checked={data}
      onChange={(name: string, checked: boolean, value: string) => {
        handleChange(path, checked);
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
