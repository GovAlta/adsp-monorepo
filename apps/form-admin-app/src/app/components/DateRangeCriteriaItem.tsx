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

export const isDateRangeValid = (fromValue?: string, toValue?: string): boolean =>
  !fromValue || !toValue || new Date(fromValue) <= new Date(toValue);

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
      <GoabFormItem label="From date" mr="m">
        <GoabInput
          type="date"
          name="date-criteria-from"
          value={fromValue ? fromValue.slice(0, 10) : ''}
          disabled={disabled}
          onChange={(detail: GoabInputOnChangeDetail) =>
            onChangeFrom(detail.value ? toDateRangeStart(detail.value) : undefined)
          }
        />
      </GoabFormItem>
      <GoabFormItem label="To date" mr="m" error={rangeValid ? '' : 'To date must not be before from date.'}>
        <GoabInput
          type="date"
          name="date-criteria-to"
          value={toValue ? toValue.slice(0, 10) : ''}
          disabled={disabled}
          error={!rangeValid}
          onChange={(detail: GoabInputOnChangeDetail) =>
            onChangeTo(detail.value ? toDateRangeEnd(detail.value) : undefined)
          }
        />
      </GoabFormItem>
    </>
  );
};
