import { CellProps, WithClassname, ControlProps, isTimeControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoabInput } from '@abgov/react-components';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { onKeyPressForTimeControl } from '../../util/inputControlUtils';
import { GoabInputOnBlurDetail, GoabInputOnKeyPressDetail } from '@abgov/ui-components-common';

export type GoAInputTimeProps = CellProps & WithClassname & WithInputProps;

export const GoATimeInput = (props: GoAInputTimeProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, path, handleChange, schema, label, isVisited, errors, setIsVisited } =
    props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;

  const width = uischema?.options?.componentProps?.readOnly ?? '100%';

  return (
    <GoabInput
      type="time"
      error={isVisited && errors.length > 0}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      value={data}
      step={1}
      width={width}
      disabled={!enabled}
      readonly={readOnly}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onBlur={(detail: GoabInputOnBlurDetail) => {
        /* istanbul ignore next */
        if (isVisited === false && setIsVisited) {
          setIsVisited();
        }
        /* istanbul ignore next */
        handleChange(path, detail.value === '' ? undefined : detail.value);
      }}
      onChange={() => {}}
      onKeyPress={(detail: GoabInputOnKeyPressDetail) => {
        onKeyPressForTimeControl({
          name: detail.name,
          value: detail.value,
          key: detail.key,
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
