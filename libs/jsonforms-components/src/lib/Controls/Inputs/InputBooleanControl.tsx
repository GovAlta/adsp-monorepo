import { isBooleanControl, RankedTester, rankWith, ControlProps, isDescriptionHidden } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoACheckbox } from '@abgov/react-components-new';
import { GoAInputBaseControl } from './InputBaseControl';
import { checkFieldValidity } from '../../util/stringUtils';

export const BooleanComponent = ({
  data,
  enabled,
  uischema,
  handleChange,
  path,
  label,
  required,
  errors,
}: ControlProps) => {
  const errorsFormInput = checkFieldValidity({
    data,
    uischema,
    label,
    required,
    errors,
  } as ControlProps);

  const text = `${uischema?.options?.text ? uischema?.options?.text : label}${required ? ' (required)' : ''}`;
  return (
    <GoACheckbox
      error={errorsFormInput.length > 0}
      testId={`${path}-checkbox-test-id`}
      disabled={!enabled}
      text={text}
      name={`${path}`}
      checked={data}
      onChange={(_: string, checked: boolean) => {
        handleChange(path, checked);
      }}
      {...uischema?.options?.componentProps}
    />
  );
};
export const BooleanControl = (props: ControlProps) => (
  <GoAInputBaseControl {...{ ...props }} input={BooleanComponent} />
);

export const GoABooleanControlTester: RankedTester = rankWith(2, isBooleanControl);
export const GoABooleanControl = withJsonFormsControlProps(BooleanControl);
