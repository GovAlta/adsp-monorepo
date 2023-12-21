import { withJsonFormsControlProps } from '@jsonforms/react';
import { GoAInput } from '@abgov/react-components-new';
import { ControlProps, ControlElement } from '@jsonforms/core';

export type GoAInputType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'date'
  | 'datetime-local'
  | 'month'
  | 'range'
  | 'search'
  | 'tel'
  | 'time'
  | 'url'
  | 'week';

export interface GoAInputUiSchemaProps extends Omit<ControlElement, 'options'> {
  options: {
    GoAInput: {
      type: GoAInputType;
      placeholder?: string;
      name: string;
      label?: string;
      testId?: string;
    };
  };
}

const GoAInputControl = (props: ControlProps) => {
  const uischema = props.uischema as unknown as GoAInputUiSchemaProps;
  const GoAInputProps = {
    label: props.label,
    value: props.data,
    ...uischema.options.GoAInput,
  };

  return (
    <GoAInput
      {...GoAInputProps}
      onChange={(name: string, value: string) => {
        props.handleChange(name, value);
      }}
    />
  );
};

export default withJsonFormsControlProps(GoAInputControl);
