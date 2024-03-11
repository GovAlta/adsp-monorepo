import React from 'react';
import { CellProps, WithClassname, ControlProps, isDateControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputDate } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { checkFieldValidity, getLabelText, isValidDate } from '../../util/stringUtils';
import { MessageControl } from '../../ErrorHandling/MessageControl';
import { isNotKeyPressTabOrShift, isRequiredAndHasNoData } from '../../util/inputControlUtils';

export type GoAInputDateProps = CellProps & WithClassname & WithInputProps;
export const errMalformedDate = (scope: string, type: string): string => {
  return `${type}-date for variable '${scope}' has an incorrect format.`;
};

const standardizeDate = (date: Date | string): string | undefined => {
  try {
    const stdDate = new Date(date).toISOString().substring(0, 10);
    return stdDate;
  } catch (e) {
    const err = e as Error;
    return undefined;
  }
};

const isValidDateFormat = (date: string): boolean => {
  const standardized = standardizeDate(date);
  return standardized !== undefined;
};

const invalidDateFormat = (scope: string, type: string): JSX.Element => {
  return MessageControl(errMalformedDate(scope, type));
};

const reformatDateProps = (props: object): object => {
  if (props) {
    if ('min' in props && typeof props.min === 'string') {
      props['min'] = standardizeDate(props.min);
    }
    if ('max' in props && typeof props.max === 'string') {
      props['max'] = standardizeDate(props.max as string);
    }
  }
  return props;
};

export const GoADateInput = (props: GoAInputDateProps): JSX.Element => {
  const { data, config, id, enabled, uischema, path, handleChange, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };

  const minDate = uischema?.options?.componentProps?.min;
  if (minDate && !isValidDateFormat(minDate)) {
    return invalidDateFormat(uischema.scope, 'Min');
  }

  const maxDate = uischema?.options?.componentProps?.max;
  if (maxDate && !isValidDateFormat(maxDate)) {
    return invalidDateFormat(uischema.scope, 'Max');
  }

  return (
    <GoAInputDate
      error={checkFieldValidity(props as ControlProps).length > 0}
      width="100%"
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={standardizeDate(data) || ''}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      disabled={!enabled}
      // Don't use handleChange in the onChange event, use the keyPress or onBlur.
      // If you use it onChange along with keyPress event it will cause a
      // side effect that causes the validation to render when it shouldn't.
      onChange={(name, value) => {}}
      onKeyPress={(name: string, value: Date | string, key: string) => {
        if (isNotKeyPressTabOrShift(key)) {
          value = standardizeDate(value) || '';
          handleChange(path, value);
        }
      }}
      onBlur={(name: string, value: Date | string) => {
        if (isRequiredAndHasNoData(props as ControlProps)) {
          value = standardizeDate(value) || '';
          handleChange(path, value);
        }
      }}
      {...reformatDateProps(uischema?.options?.componentProps)}
    />
  );
};

export const GoADateControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoADateInput} />;

export const GoADateControlTester: RankedTester = rankWith(4, isDateControl);
export const GoAInputDateControl = withJsonFormsControlProps(GoADateControl);
