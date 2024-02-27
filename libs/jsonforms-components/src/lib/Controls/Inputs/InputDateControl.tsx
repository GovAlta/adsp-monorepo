import React from 'react';
import { CellProps, WithClassname, ControlProps, isDateControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputDate } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { getErrorsToDisplay, getLabelText, isValidDate } from '../../util/stringUtils';
type GoAInputDateProps = CellProps & WithClassname & WithInputProps;

export const GoADateInput = (props: GoAInputDateProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, errors, isValid, path, handleChange, schema, label } = props;

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };

  const errorsFormInput = getErrorsToDisplay(props as ControlProps);

  return (
    <GoAInputDate
      error={errorsFormInput.length > 0}
      width="100%"
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={data ? new Date(data).toISOString().substring(0, 10) : ''}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      disabled={!enabled}
      // Dont use handleChange in the onChange event, use the keyPress or onBlur.
      // If you use it onChange along with keyPress event it will cause a
      // side effect that causes the validation to render when it shouldnt.
      onChange={(name, value) => {}}
      onKeyPress={(name: string, value: Date | string, key: string) => {
        if (!(key === 'Tab' || key === 'Shift')) {
          value = isValidDate(value) ? new Date(value)?.toISOString().substring(0, 10) : '';
          handleChange(path, value);
        }
      }}
      onBlur={(name: string, value: Date | string) => {
        value = isValidDate(value) ? new Date(value)?.toISOString().substring(0, 10) : '';
        handleChange(path, value);
      }}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoADateControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoADateInput} />;

export const GoADateControlTester: RankedTester = rankWith(4, isDateControl);
export const GoAInputDateControl = withJsonFormsControlProps(GoADateControl);
