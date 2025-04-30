import React from 'react';
import { isBooleanControl, RankedTester, rankWith, ControlProps, optionIs, and } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoARadioGroup, GoARadioItem } from '@abgov/react-components';
import { GoAInputBaseControl } from './InputBaseControl';
import { WithInputProps } from './type';

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
    <GoARadioGroup
      error={isVisited && errors.length}
      name={`${label}`}
      value={data === true ? TrueValue : data === false ? FalseValue : null}
      disabled={!enabled}
      testId={BaseTestId}
      onChange={(_name, value) => {
        if (value === TrueValue) {
          handleChange(path, true);
        }
        if (value === FalseValue) {
          handleChange(path, false);
        }
      }}
      {...uischema?.options?.componentProps}
    >
      <GoARadioItem
        value={TrueValue}
        testId={`${BaseTestId}-yes-option`}
        description={EnableDescription ? TrueDescription : null}
      />
      <GoARadioItem
        value={FalseValue}
        testId={`${BaseTestId}-no-option`}
        description={EnableDescription ? FalseDescription : null}
      />
    </GoARadioGroup>
  );
};
export const BooleanRadioControl = (props: ControlProps) => (
  <GoAInputBaseControl {...{ ...props }} input={BooleanRadioComponent} />
);

export const GoABooleanRadioControlTester: RankedTester = rankWith(3, and(isBooleanControl, optionIs('radio', true)));
export const GoABooleanRadioControl = withJsonFormsControlProps(BooleanRadioControl);
