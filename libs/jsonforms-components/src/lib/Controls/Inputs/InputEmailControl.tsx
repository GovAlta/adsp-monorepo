import React, { useState, useContext, useEffect } from 'react';
import {
  rankWith,
  and,
  isControl,
  schemaMatches,
  RankedTester,
  WithClassname,
  ControlProps,
  JsonSchema,
  schemaTypeIs,
  formatIs,
} from '@jsonforms/core';
import { GoabInput, GoabFormItem } from '@abgov/react-components';
import { WithInputProps } from './type';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { onChangeForInputControl, onBlurForTextControl } from '../../util/inputControlUtils';
import { FormFieldWrapper } from './style-component';
import { Visible } from '../../util';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from '../FormStepper/context';
import { useRegisterUser } from '../../Context/register';
import { JsonFormRegisterProvider } from '../../Context/register';
import { REQUIRED_PROPERTY_ERROR } from '../../common/Constants';
import { useDebounce } from '../../util/useDebounce';

import { GoabInputOnChangeDetail, GoabInputOnBlurDetail } from '@abgov/ui-components-common';

type GoAEmailControlProps = ControlProps & WithInputProps;
type ExtendedJsonSchema = JsonSchema & {
  label?: string;
  errorMessage?: { pattern: string };
};

const defaultLabel = 'Email address';

export const GoAEmailInput = (props: GoAEmailControlProps): JSX.Element => {
  const { data, config, id, enabled, visible, uischema, errors, schema, required, label, handleChange } = props;
  const defaultSchema = schema as ExtendedJsonSchema;
  const appliedUiSchemaOptions = { ...config, ...uischema?.options };
  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  const width = uischema?.options?.componentProps?.width ?? '100%';
  const user = useRegisterUser();

  const formStepperCtx = useContext(JsonFormsStepperContext);
  const stepperState = (formStepperCtx as JsonFormsStepperContextProps)?.selectStepperState?.();
  const currentCategory = stepperState?.categories?.[stepperState?.activeId];
  const showReviewLink = currentCategory?.showReviewPageLink;

  const [localValue, setLocalValue] = useState<string>(data);

  const debouncedValue = useDebounce(localValue, 300);

  /* istanbul ignore next */
  useEffect(() => {
    if (debouncedValue === data) return;
    // Only sync if debouncedValue differs from data and is not initial empty state
    if (debouncedValue !== data && (debouncedValue !== '' || data !== undefined)) {
      onChangeForInputControl({
        name: '',
        value: debouncedValue,
        controlProps: props as ControlProps,
      });
    }
  }, [debouncedValue]);

  const [manualInput, setManualInput] = useState<boolean>(false);
  const [isVisited, setIsVisited] = useState(false);

  useEffect(() => {
    if (showReviewLink === true) {
      setIsVisited(true);
    }
  }, [showReviewLink]);

  const splitErrors = (errors ?? '')
    .split(/\r?\n/)
    .map((e) => e.trim())
    .filter(Boolean);

  const primaryLabel = defaultSchema?.label || defaultLabel;

  const splintIndex = splitErrors.findIndex((e) => e === REQUIRED_PROPERTY_ERROR);
  splitErrors[splintIndex] = `${primaryLabel} is required`;

  const finalErrors = splitErrors.join('\n');


  useEffect(() => {
    if (typeof handleChange === 'function' && schema?.default !== undefined) {
      handleChange(props.path, schema.default);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.default]);

  return (
    <Visible visible={visible}>
      <JsonFormRegisterProvider defaultRegisters={undefined}>
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
                setManualInput(true);
                if (!isVisited) {
                  setIsVisited(true);
                }
                setLocalValue(detail.value);
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
      </JsonFormRegisterProvider>
    </Visible>
  );
};

export const GoAEmailControl = (props: ControlProps & WithClassname) => <GoAEmailInput {...props} />;

export const GoAEmailControlTester: RankedTester = rankWith(
  4,
  and(isControl, schemaTypeIs('string'), formatIs('email')),
);

export const GoAInputEmailControl = withJsonFormsControlProps(GoAEmailControl);
