import { isBooleanControl, RankedTester, rankWith, ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoACheckbox } from '@abgov/react-components-new';
import { GoAInputBaseControl } from './InputBaseControl';
import { getLastSegmentFromPointer, convertToReadableFormat } from '../../util/stringUtils';
import { WithInputProps } from './type';

export const BooleanComponent = ({
  data,
  enabled,
  uischema,
  handleChange,
  path,
  label,
  required,
  errors,
  schema,
  isVisited,
}: ControlProps & WithInputProps) => {
  const text = `${
    uischema?.options?.text ? uischema?.options?.text : schema?.title ? schema?.title : schema?.description
  }${required ? ' (required)' : ''}`;

  return (
    <GoACheckbox
      error={isVisited && errors.length > 0}
      testId={`${path}-checkbox-test-id`}
      disabled={!enabled}
      text={text && text !== 'undefined' ? text : convertToReadableFormat(getLastSegmentFromPointer(uischema.scope))}
      name={`${path}`}
      checked={data}
      onChange={(_: string, checked: boolean) => {
        handleChange(path, checked);
      }}
      {...uischema?.options?.componentProps}
      mb="none"
    />
  );
};
export const BooleanControl = (props: ControlProps) => (
  <GoAInputBaseControl {...{ ...props }} input={BooleanComponent} />
);

export const GoABooleanControlTester: RankedTester = rankWith(2, isBooleanControl);
export const GoABooleanControl = withJsonFormsControlProps(BooleanControl);
