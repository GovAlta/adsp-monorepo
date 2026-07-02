import { GoabFormItem, GoabInput } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
import { toDateRangeStart, toDateRangeEnd } from '../state/form.slice';

interface DateRangeCriteriaItemProps {
  fromValue?: string;
  toValue?: string;
  disabled?: boolean;
  onChangeFrom: (value?: string) => void;
  onChangeTo: (value?: string) => void;
}

export const isDateRangeValid = (fromValue?: string, toValue?: string): boolean => {
  const isRangeOpenEnded = !fromValue || !toValue;
  return isRangeOpenEnded || new Date(fromValue) <= new Date(toValue);
};

export const isSearchDisabled = (
  loading: boolean,
  criteria: { createDateAfter?: string; createDateBefore?: string },
): boolean => loading || !isDateRangeValid(criteria.createDateAfter, criteria.createDateBefore);

interface DateCriteriaInputProps {
  label: string;
  name: string;
  value?: string;
  disabled?: boolean;
  error?: string;
  onChange: (value?: string) => void;
}

const DateCriteriaInput: FunctionComponent<DateCriteriaInputProps> = ({
  label,
  name,
  value,
  disabled,
  error,
  onChange,
}) => (
  <GoabFormItem label={label} mr="m" error={error}>
    <GoabInput
      type="date"
      name={name}
      value={value ? value.slice(0, 10) : ''}
      disabled={disabled}
      error={!!error}
      onChange={(detail: GoabInputOnChangeDetail) => onChange(detail.value || undefined)}
    />
  </GoabFormItem>
);

export const DateRangeCriteriaItem: FunctionComponent<DateRangeCriteriaItemProps> = ({
  fromValue,
  toValue,
  disabled,
  onChangeFrom,
  onChangeTo,
}) => {
  const rangeValid = isDateRangeValid(fromValue, toValue);

  return (
    <>
      <DateCriteriaInput
        label="From date"
        name="date-criteria-from"
        value={fromValue}
        disabled={disabled}
        onChange={(value) => onChangeFrom(value ? toDateRangeStart(value) : undefined)}
      />
      <DateCriteriaInput
        label="To date"
        name="date-criteria-to"
        value={toValue}
        disabled={disabled}
        error={rangeValid ? '' : 'To date must not be before from date.'}
        onChange={(value) => onChangeTo(value ? toDateRangeEnd(value) : undefined)}
      />
    </>
  );
};
