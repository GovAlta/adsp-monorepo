import { CellProps, WithClassname, ControlProps, isTimeControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInputTime } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { checkFieldValidity } from '../../util/stringUtils';
import { onBlurForTimeControl, onKeyPressForTimeControl } from '../../util/inputControlUtils';
export type GoAInputTimeProps = CellProps & WithClassname & WithInputProps;

export const GoATimeInput = (props: GoAInputTimeProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;

  const errorsFormInput = checkFieldValidity(props as ControlProps);
  const width = uischema?.options?.componentProps?.readOnly ?? '100%';

  return (
    <GoAInputTime
      error={errorsFormInput.length > 0}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={data}
      step={1}
      width={width}
      disabled={!enabled}
      readonly={readOnly}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onBlur={(name: string, value: string) => {
        onBlurForTimeControl({
          name,
          value,
          controlProps: props as ControlProps,
        });
      }}
      // Dont use handleChange in the onChange event, use the keyPress or onBlur.
      // If you use it onChange along with keyPress event it will cause a
      // side effect that causes the validation to render when it shouldnt.
      onChange={(name: string, value: string) => {}}
      onKeyPress={(name: string, value: string, key: string) => {
        onKeyPressForTimeControl({
          name,
          value,
          key,
          controlProps: props as ControlProps,
        });
      }}
      {...uischema?.options?.componentProps}
    />
  );
};

export const GoATimeControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoATimeInput} />;

export const GoATimeControlTester: RankedTester = rankWith(4, isTimeControl);
export const GoAInputTimeControl = withJsonFormsControlProps(GoATimeControl);
