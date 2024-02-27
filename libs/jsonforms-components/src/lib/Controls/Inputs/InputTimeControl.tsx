import React from 'react';
import { CellProps, WithClassname, ControlProps, isTimeControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputTime } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { getErrorsToDisplay, isValidDate } from '../../util/stringUtils';
type GoAInputTimeProps = CellProps & WithClassname & WithInputProps;

export const GoATimeInput = (props: GoAInputTimeProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const errorsFormInput = getErrorsToDisplay(props as ControlProps);

  return (
    <GoAInputTime
      error={errorsFormInput.length > 0}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={data}
      step={1}
      width="100%"
      disabled={!enabled}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onBlur={(name: string, value: string) => {
        value = isValidDate(value) ? new Date(value)?.toISOString().substring(0, 10) : '';
        handleChange(path, value);
      }}
      // Dont use handleChange in the onChange event, use the keyPress or onBlur.
      // If you use it onChange along with keyPress event it will cause a
      // side effect that causes the validation to render when it shouldnt.
      onChange={(name, value) => {}}
      onKeyPress={(name: string, value: string, key: string) => {
        if (!(key === 'Tab' || key === 'Shift')) {
          value = isValidDate(value) ? new Date(value)?.toISOString().substring(0, 10) : '';
          handleChange(path, value);
        }
      }}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoATimeControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoATimeInput} />;

export const GoATimeControlTester: RankedTester = rankWith(4, isTimeControl);
export const GoAInputTimeControl = withJsonFormsControlProps(GoATimeControl);
