import { CellProps, WithClassname, ControlProps, isDateControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoabDatePicker } from '@abgov/react-components';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { onBlurForDateControl, onChangeForDateControl, onKeyPressForDateControl } from '../../util/inputControlUtils';
import { callout } from '../../Additional/GoACalloutControl';
import { standardizeDate } from '../../util/dateUtils';
import { GoabInputOnChangeDetail, GoabInputOnBlurDetail, GoabInputOnKeyPressDetail } from '@abgov/ui-components-common';

export type GoAInputDateProps = CellProps & WithClassname & WithInputProps;
export const errMalformedDate = (scope: string, type: string): string => {
  return `${type}-date for variable '${scope}' has an incorrect format.`;
};

const isValidDateFormat = (date: string): boolean => {
  const standardized = standardizeDate(date);
  return standardized !== undefined;
};

const invalidDateFormat = (scope: string, type: string): JSX.Element => {
  return callout({ message: errMalformedDate(scope, type) });
};

// eslint-disable-next-line
const reformatDateProps = (props: any): any => {
  const newProps = { ...props };
  if (newProps) {
    if (newProps?.min && typeof newProps.min === 'string') {
      newProps.min = standardizeDate(newProps.min);
    }
    if (newProps?.max && typeof newProps.max === 'string') {
      newProps.max = standardizeDate(newProps.max as string);
    }
  }
  return newProps;
};

export const GoADateInput = (props: GoAInputDateProps): JSX.Element => {
  const { data, config, id, enabled, uischema, errors, isVisited, label, setIsVisited } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const width = uischema?.options?.componentProps?.width ?? '100%';
  const allowPastDate = uischema?.options?.allowPastDate;
  const allowFutureDate = uischema?.options?.allowFutureDate;

  let minDate = uischema?.options?.componentProps?.min;
  let maxDate = uischema?.options?.componentProps?.max;

  // Only apply if not both are true
  if (allowPastDate && !allowFutureDate) {
    // Only allow today and past dates
    const today = new Date();
    maxDate = today.toISOString().split('T')[0];
  } else if (!allowPastDate && allowFutureDate) {
    // Only allow today and future dates
    const today = new Date();
    minDate = today.toISOString().split('T')[0];
  }

  return (
    <GoabDatePicker
      type="calendar"
      error={isVisited && errors.length > 0}
      width={width}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={standardizeDate(data) || ''}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      disabled={!enabled}
      readonly={readOnly}
      min={minDate && new Date(minDate)}
      max={maxDate && new Date(maxDate)}
      onChange={(detail: GoabInputOnChangeDetail) => {
        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }
        onChangeForDateControl({
          name: detail.name,
          value: detail.value,
          controlProps: props as ControlProps,
        });
      }}
      onKeyPress={(detail: GoabInputOnKeyPressDetail) => {
        onKeyPressForDateControl({
          name: detail.name,
          value: detail.value,
          key: detail.key,
          controlProps: props as ControlProps,
        });
      }}
      onBlur={(detail: GoabInputOnBlurDetail) => {
        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }

        onBlurForDateControl({
          name: detail.name,
          value: detail.value,
          controlProps: props as ControlProps,
        });
      }}
      {...reformatDateProps(uischema?.options?.componentProps)}
    />
  );
};

export const GoADateControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoADateInput} />;

export const GoADateControlTester: RankedTester = rankWith(4, isDateControl);
export const GoAInputDateControl = withJsonFormsControlProps(GoADateControl);
