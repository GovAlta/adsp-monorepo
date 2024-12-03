import { CellProps, WithClassname, ControlProps, isDateControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputDate } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps, useJsonForms } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { checkFieldValidity } from '../../util/stringUtils';
import { onBlurForDateControl, onChangeForDateControl, onKeyPressForDateControl } from '../../util/inputControlUtils';
import { callout } from '../../Additional/GoACalloutControl';
import { standardizeDate } from '../../util/dateUtils';

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
  const ctx = useJsonForms();
  const { data, config, id, enabled, uischema, path, handleChange, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const width = uischema?.options?.componentProps?.width ?? '100%';

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
      error={checkFieldValidity(props as ControlProps, ctx).length > 0}
      width={width}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={standardizeDate(data) || ''}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      disabled={!enabled}
      readonly={readOnly}
      onChange={(name: string, value: Date | string) => {
        onChangeForDateControl({
          name,
          value,
          controlProps: props as ControlProps,
        });
      }}
      onKeyPress={(name: string, value: Date | string, key: string) => {
        onKeyPressForDateControl({
          name,
          value,
          key,
          controlProps: props as ControlProps,
        });
      }}
      onBlur={(name: string, value: Date | string) => {
        onBlurForDateControl({
          name,
          value,
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
