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
  description,
}: ControlProps) => {
  const appliedUiSchemaOptions = { ...config, ...uischema.options };

  const showDescription = !isDescriptionHidden(
    visible,
    description,
    false,
    appliedUiSchemaOptions.showUnfocusedDescription
  );

  return (
    <Hidden xsUp={!visible}>
      <GoACheckbox
        testId={`${path}-checkbox-test-id`}
        disabled={!enabled}
        text={`${description}`}
        name={`${path}`}
        checked={data}
        onChange={(name: string, checked: boolean, value: string) => {
          handleChange(path, checked);
        }}
      ></GoACheckbox>
    </Hidden>
  );
};
export const BooleanControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={BooleanComponent} />;

export const GoABooleanControlTester: RankedTester = rankWith(2, isBooleanControl);
export const GoABooleanControl = withJsonFormsControlProps(BooleanControl);
