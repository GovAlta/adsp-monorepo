import React, { useState } from 'react';
import {
  rankWith,
  and,
  isControl,
  schemaMatches,
  RankedTester,
  WithClassname,
  ControlProps,
  JsonSchema,
} from '@jsonforms/core';
import { GoAInput, GoAFormItem } from '@abgov/react-components';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { onChangeForInputControl, onBlurForTextControl } from '../../util/inputControlUtils';
import { FormFieldWrapper } from './style-component';
import { Visible } from '../../util';

type GoAEmailControlProps = ControlProps & WithInputProps;
type ExtendedJsonSchema = JsonSchema & {
  label?: string;
  errorMessage?: { pattern: string };
};

const defaultLabel = 'Email address';

export const GoAEmailInput = (props: GoAEmailControlProps): JSX.Element => {
  const { data, config, id, enabled, visible, uischema, errors, schema, required, label } = props;
  const defaultSchema = schema as ExtendedJsonSchema;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const width = uischema?.options?.componentProps?.width ?? '100%';

  const [isVisited, setIsVisited] = useState(false);

  const splitErrors = (errors ?? '')
    .split(/\r?\n/)
    .map((e) => e.trim())
    .filter(Boolean);

  const primaryLabel = defaultSchema?.label || defaultLabel;

  const splintIndex = splitErrors.findIndex((e) => e === 'is a required property');
  splitErrors[splintIndex] = `${primaryLabel} is required`;

  const finalErrors = splitErrors.join('\n');

  return (
    <Visible visible={visible}>
      <FormFieldWrapper>
        <GoAFormItem
          error={isVisited && finalErrors}
          testId="form-email-input-wrapper"
          requirement={required ? 'required' : undefined}
          label={primaryLabel}
        >
          <GoAInput
            error={isVisited && finalErrors.length > 0}
            type={'email'}
            width={width}
            name="Email address"
            value={data}
            testId={appliedUiSchemaOptions?.testId || `${id}-input`}
            disabled={!enabled}
            readonly={readOnly}
            onChange={(name: string, value: Date | string) => {
              if (!isVisited) {
                setIsVisited(true);
              }
              onChangeForInputControl({
                name,
                value,
                controlProps: props as ControlProps,
              });
            }}
            onBlur={(name: string, value: Date | string) => {
              if (!isVisited) {
                setIsVisited(true);
              }
              onBlurForTextControl({
                name,
                value,
                controlProps: props as ControlProps,
              });
            }}
          />
        </GoAFormItem>
      </FormFieldWrapper>
    </Visible>
  );
};

export const GoAEmailControl = (props: ControlProps & WithClassname) => <GoAEmailInput {...props} />;

export const GoAEmailControlTester: RankedTester = rankWith(
  4,
  and(
    isControl,
    schemaMatches((schema) => schema.format === 'email')
  )
);
export const GoAInputEmailControl = withJsonFormsControlProps(GoAEmailControl);
