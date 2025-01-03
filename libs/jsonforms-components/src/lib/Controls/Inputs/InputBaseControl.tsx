import React, { useContext, useEffect } from 'react';
import { GoAFormItem } from '@abgov/react-components-new';
import { ControlProps } from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';
import { checkFieldValidity, getLabelText } from '../../util/stringUtils';
import { StepInputStatus, StepperContext } from '../FormStepper/StepperContext';
import { Visible } from '../../util';
import { JsonFormRegisterProvider } from '../../Context/register';
import { FormFieldWrapper } from './style-component';
import { ErrorObject } from 'ajv';

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

export interface WithInput {
  //eslint-disable-next-line
  input: any;
  noLabel?: boolean;
  isStepperReview?: boolean;
}

export const GoAInputBaseControl = (props: ControlProps & WithInput): JSX.Element => {
  const { uischema, visible, label, input, required, errors, path, isStepperReview, id } = props;
  const InnerComponent = input;
  const labelToUpdate: string = getLabelText(uischema.scope, label || '');
  const ctx = useJsonForms();
  let modifiedErrors = checkFieldValidity(props as ControlProps);

  if (modifiedErrors === 'must be equal to one of the allowed values') {
    modifiedErrors = '';
  }

  useEffect(() => {
    if (ctx.core?.ajv) {
      // eslint-disable-next-line
      const newError: ErrorObject<string, Record<string, any>, unknown> = {
        instancePath: path,
        message: modifiedErrors,
        schemaPath: id,
        keyword: '',
        params: {},
      };

      const existingErrorIndex = (ctx.core.ajv.errors || []).findIndex((error) => {
        return error?.schemaPath === id;
      });
      if (modifiedErrors) {
        if (existingErrorIndex > -1) {
          (ctx.core.ajv.errors || [])[existingErrorIndex] = newError;
        } else {
          ctx.core.ajv.errors = [...(ctx.core.ajv.errors || []), newError];
        }
      } else {
        if (existingErrorIndex > -1) {
          delete (ctx.core.ajv.errors || [])[existingErrorIndex];
        }
      }

      ctx.core.ajv.errors = ctx.core?.ajv?.errors?.filter((e) => e !== null) || [];
    }
  }, [modifiedErrors, ctx, path, id]);

  const getStepStatus = (props: ControlProps & WithInput, value: unknown): StepInputStatus => {
    return {
      id: props.id,
      value: value,
      required: props.required || false,
      type: props.schema.type,
      step: stepperContext.stepId,
    };
  };

  const stepperContext = useContext(StepperContext);
  const handlerWithStepperUpdate = (path: string, value: unknown) => {
    stepperContext.updateStatus(getStepStatus(props, value));
    props.handleChange(path, value);
  };
  const modifiedProps = { ...props, handleChange: handlerWithStepperUpdate };

  useEffect(() => {
    if (!stepperContext.isInitialized(props.id)) {
      const status = getStepStatus(props, props.data);
      stepperContext.updateStatus(status);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <JsonFormRegisterProvider defaultRegisters={undefined}>
      <Visible visible={visible}>
        <FormFieldWrapper>
          <GoAFormItem
            requirement={required ? 'required' : undefined}
            error={modifiedErrors}
            testId={`${isStepperReview === true && 'review-base-'}${path}`}
            label={props?.noLabel === true ? '' : labelToUpdate}
            helpText={typeof uischema?.options?.help === 'string' && !isStepperReview ? uischema?.options?.help : ''}
          >
            <InnerComponent {...modifiedProps} />
          </GoAFormItem>
        </FormFieldWrapper>
      </Visible>
    </JsonFormRegisterProvider>
  );
};
