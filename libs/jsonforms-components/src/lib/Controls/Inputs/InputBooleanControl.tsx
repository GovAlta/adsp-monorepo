import { isBooleanControl, RankedTester, rankWith, ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoabCheckbox } from '@abgov/react-components';
import { GoAInputBaseControl } from './InputBaseControl';
import { getLastSegmentFromPointer, convertToReadableFormat } from '../../util/stringUtils';
import { WithInputProps } from './type';
import { CheckboxWrapper } from './style-component';
import { GoabCheckboxOnChangeDetail } from '@abgov/ui-components-common';
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
  const getRequiredLabelText = () => {
    let label = '';
    if (uischema?.options?.text) {
      label = uischema?.options?.text;
    } else if (schema?.title) {
      label = schema?.title;
    } else if (schema?.description) {
      label = schema?.description;
    } else if (uischema?.label) {
      label = uischema?.label as string;
    }
    return `${label}${required ? ' (required)' : ''}`;
  };

  const text = getRequiredLabelText();

  return (
    <CheckboxWrapper>
      <GoabCheckbox
        error={isVisited && errors.length > 0}
        testId={`${path}-checkbox-test-id`}
        disabled={!enabled}
        text={text && text !== 'undefined' ? text : convertToReadableFormat(getLastSegmentFromPointer(uischema.scope))}
        name={`${path}`}
        checked={data}
        onChange={(detail: GoabCheckboxOnChangeDetail) => {
          handleChange(path, detail.checked);
        }}
        {...uischema?.options?.componentProps}
        mb="none"
      />
    </CheckboxWrapper>
  );
};
export const BooleanControl = (props: ControlProps) => (
  <GoAInputBaseControl {...{ ...props }} input={BooleanComponent} />
);

export const GoABooleanControlTester: RankedTester = rankWith(2, isBooleanControl);
export const GoABooleanControl = withJsonFormsControlProps(BooleanControl);
