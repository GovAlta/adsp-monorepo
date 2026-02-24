import { CellProps, WithClassname, ControlProps, isDateControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoabInput } from '@abgov/react-components';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import {
  onBlurForDateControl,
  onChangeForDateControl,
  onKeyPressForDateControl,
  ensureGoaDatePointerCursor,
} from '../../util/inputControlUtils';
import { standardizeDate } from '../../util/dateUtils';
import { GoabInputOnChangeDetail, GoabInputOnBlurDetail, GoabInputOnKeyPressDetail } from '@abgov/ui-components-common';
import { useEffect, useRef } from 'react';

export type GoAInputDateProps = CellProps & WithClassname & WithInputProps;
export const errMalformedDate = (scope: string, type: string): string => {
  return `${type}-date for variable '${scope}' has an incorrect format.`;
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

  const todayLocalYmd = (): string => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  if (allowPastDate && !allowFutureDate) {
    maxDate = todayLocalYmd();
  } else if (!allowPastDate && allowFutureDate) {
    minDate = todayLocalYmd();
  }
  const hostRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const host = hostRef.current ?? document.querySelector('goa-input[type="date"]');
    host?.shadowRoot?.querySelector('input[type="date"]');
    ensureGoaDatePointerCursor(host);
  }, [appliedUiSchemaOptions?.name, id]);

  return (
    <GoabInput
      type="date"
      ref={hostRef}
      error={isVisited && errors.length > 0}
      width={width}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={standardizeDate(data) || ''}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      disabled={!enabled}
      readonly={readOnly}
      min={minDate ? standardizeDate(minDate) || undefined : undefined}
      max={maxDate ? standardizeDate(maxDate) || undefined : undefined}
      onChange={(detail: GoabInputOnChangeDetail) => {
        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }
        onChangeForDateControl({
          name: detail.name ?? 'date',
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
