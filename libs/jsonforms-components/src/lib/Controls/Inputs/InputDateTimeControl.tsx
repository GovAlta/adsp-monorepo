import React from 'react';
import { CellProps, WithClassname, ControlProps, isDateTimeControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoabInput } from '@abgov/react-components';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import {
  onBlurForDateControl,
  onChangeForDateTimeControl,
  onKeyPressForDateControl,
} from '../../util/inputControlUtils';
import { GoabInputOnChangeDetail, GoabInputOnKeyPressDetail, GoabInputOnBlurDetail } from '@abgov/ui-components-common';

export type GoAInputDateTimeProps = CellProps & WithClassname & WithInputProps;

export const GoADateTimeInput = (props: GoAInputDateTimeProps): JSX.Element => {
  const { data, config, id, enabled, uischema, isVisited, errors, label, setIsVisited } = props;

  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const width = uischema?.options?.componentProps?.width ?? '100%';

  return (
    <GoabInput
      type="time"
      error={isVisited && errors.length > 0}
      width={width}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={data ? new Date(data).toISOString().slice(0, 10) : ''}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      disabled={!enabled}
      readonly={readOnly}
      onChange={(detail: GoabInputOnChangeDetail) => {
        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }
        onChangeForDateTimeControl({
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
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoADateTimeControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoADateTimeInput} />;

export const GoADateTimeControlTester: RankedTester = rankWith(2, isDateTimeControl);
export const GoAInputDateTimeControl = withJsonFormsControlProps(GoADateTimeControl);
