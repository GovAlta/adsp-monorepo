import React from 'react';
import { isBooleanControl, RankedTester, rankWith, ControlProps, optionIs, and } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoabRadioGroup, GoabRadioItem } from '@abgov/react-components';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithInputProps } from './type';
import { GoabRadioGroupOnChangeDetail } from '@abgov/ui-components-common';
export const BooleanRadioComponent = ({
  data,
  enabled,
  uischema,
  handleChange,
  path,
  config,
  label,
  isVisited,
  errors,
  description,
}: ControlProps & WithInputProps) => {
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const TrueValue = appliedUiSchemaOptions?.textForTrue || 'Yes';
  const FalseValue = appliedUiSchemaOptions?.textForFalse || 'No';
  const EnableDescription = appliedUiSchemaOptions?.enableDescription === true;
  const TrueDescription = description || appliedUiSchemaOptions?.descriptionForTrue;
  const FalseDescription = description || appliedUiSchemaOptions?.descriptionForFalse;
  const BaseTestId = appliedUiSchemaOptions?.testId || `${path}-boolean-radio-jsonform`;

  return (
    <GoabRadioGroup
      error={isVisited && errors.length}
      name={`${label}`}
      value={data === true ? TrueValue : data === false ? FalseValue : null}
      disabled={!enabled}
      testId={BaseTestId}
      onChange={(detail: GoabRadioGroupOnChangeDetail) => {
        if (detail.value === TrueValue) {
          handleChange(path, true);
        }
        if (detail.value === FalseValue) {
          handleChange(path, false);
        }
      }}
      {...uischema?.options?.componentProps}
    >
      <GoabRadioItem
        value={TrueValue}
        data-testId={`${BaseTestId}-yes-option`}
        description={EnableDescription ? TrueDescription : null}
      />
      <GoabRadioItem
        value={FalseValue}
        data-testId={`${BaseTestId}-no-option`}
        description={EnableDescription ? FalseDescription : null}
      />
    </GoabRadioGroup>
  );
};
export const BooleanRadioControl = (props: ControlProps) => (
  <GoAInputBaseControl {...{ ...props }} input={BooleanRadioComponent} />
);

export const GoABooleanRadioControlTester: RankedTester = rankWith(3, and(isBooleanControl, optionIs('radio', true)));
export const GoABooleanRadioControl = withJsonFormsControlProps(BooleanRadioControl);
