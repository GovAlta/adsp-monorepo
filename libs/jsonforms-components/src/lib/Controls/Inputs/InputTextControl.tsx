import React from 'react';
import { CellProps, WithClassname, ControlProps, isStringControl, RankedTester, rankWith } from '@jsonforms/core';
import { GoAInput, GoAInputDate, GoAInputTime, GoAInputDateTime } from '@abgov/react-components-new';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInputBaseControl } from './InputBaseControl';
import { JsonFormContext } from '../../Context';
type GoAInputTextProps = CellProps & WithClassname & WithInputProps;

export const GoAInputText = (props: GoAInputTextProps): JSX.Element => {
  // eslint-disable-next-line
  const { data, config, id, enabled, uischema, isValid, path, handleChange, schema, label } = props;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const placeholder = appliedUiSchemaOptions?.placeholder || schema?.description || '';
  const enumerators = useContext(JsonFormContext);
  return (
    <GoAInput
      type={appliedUiSchemaOptions.format === 'password' ? 'password' : 'text'}
      disabled={!enabled}
      value={data}
      width={'100%'}
      placeholder={placeholder}
      // maxLength={appliedUiSchemaOptions?.maxLength}
      name={appliedUiSchemaOptions?.name || `${id || label}-input`}
      testId={appliedUiSchemaOptions?.testId || `${id}-input`}
      onChange={(name: string, value: string) => {
        enumerators.set('dirty', () => ['true']);
        handleChange(path, value);
      }}
      onKeyPress={(name: string, value: string) => {
        handleChange(path, value);
      }}
    />
  );
};

export const GoATextControl = (props: ControlProps) => <GoAInputBaseControl {...props} input={GoAInputText} />;

export const GoATextControlTester: RankedTester = rankWith(1, isStringControl);
export const GoAInputTextControl = withJsonFormsControlProps(GoATextControl);
function useContext(
  JsonFormContext: React.Context<{
    data: Map<string, () => string[] | Record<string, any>>;
    functions: Map<string, () => (file: File, propertyId: string) => void>;
  }>
) {
  throw new Error('Function not implemented.');
}
