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
import { GoabInput, GoabFormItem } from '@abgov/react-components';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { onChangeForInputControl, onBlurForTextControl } from '../../util/inputControlUtils';
import { FormFieldWrapper } from './style-component';
import { Visible } from '../../util';

import { GoabInputOnChangeDetail, GoabInputOnBlurDetail } from '@abgov/ui-components-common';

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
        <GoabFormItem
          error={isVisited && finalErrors}
          testId="form-email-input-wrapper"
          requirement={required ? 'required' : undefined}
          label={primaryLabel}
        >
          <GoabInput
            error={isVisited && finalErrors.length > 0}
            type={'email'}
            width={width}
            name="Email address"
            value={data}
            testId={appliedUiSchemaOptions?.testId || `${id}-input`}
            disabled={!enabled}
            readonly={readOnly}
            onChange={(detail: GoabInputOnChangeDetail) => {
              if (!isVisited) {
                setIsVisited(true);
              }
              onChangeForInputControl({
                name: detail.name,
                value: detail.value,
                controlProps: props as ControlProps,
              });
            }}
            onBlur={(detail: GoabInputOnBlurDetail) => {
              if (!isVisited) {
                setIsVisited(true);
              }
              onBlurForTextControl({
                name: detail.name,
                value: detail.value,
                controlProps: props as ControlProps,
              });
            }}
          />
        </GoabFormItem>
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
