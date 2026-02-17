/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useContext, useEffect, useRef } from 'react';
import { GoabFormItem } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { checkFieldValidity } from '../../util/stringUtils';
import { Visible } from '../../util';
import { JsonFormRegisterProvider } from '../../Context/register';
import { FormFieldWrapper } from './style-component';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from '../FormStepper/context';
import { isRequiredBySchema } from '../../util/requiredUtil';
import { useJsonForms } from '@jsonforms/react';
export type GoabInputType =
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
  setIsVisited?: () => void;
  skipInitialValidation?: boolean;
}

export const GoAInputBaseControl = (props: ControlProps & WithInput): JSX.Element => {
  const { uischema, visible, label, input, required, errors, path, isStepperReview, skipInitialValidation } = props;
  const InnerComponent = input;
  const labelToUpdate: string = label || '';
  const controlRef = useRef<HTMLDivElement>(null);

  let modifiedErrors = checkFieldValidity(props as ControlProps);

  const formStepperCtx = useContext(JsonFormsStepperContext);
  const stepperState = (formStepperCtx as JsonFormsStepperContextProps)?.selectStepperState?.();
  const currentCategory = stepperState?.categories?.[stepperState?.activeId];
  const showReviewLink = currentCategory?.showReviewPageLink;

  const [isVisited, setIsVisited] = useState(skipInitialValidation === true);
  const { core } = useJsonForms();
  const rootData = core?.data as any;
  useEffect(() => {
    if (showReviewLink === true && !isStepperReview) {
      setIsVisited(true);
    }
  }, [showReviewLink, isStepperReview]);

  /* istanbul ignore next */
  useEffect(() => {
    if (stepperState?.targetScope && stepperState.targetScope === uischema.scope && controlRef.current) {
      const inputElement = controlRef.current.querySelector(
        'input, textarea, select, goa-input, goa-textarea, goa-dropdown, goa-checkbox, goa-radio-group',
      );

      if (inputElement) {
        controlRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          if (inputElement.tagName?.toLowerCase().startsWith('goa-')) {
            (inputElement as any).focused = true;
            if (typeof (inputElement as any).focus === 'function') {
              (inputElement as any).focus();
            }
            const shadowRoot = (inputElement as any).shadowRoot;
            if (shadowRoot) {
              const actualInput = shadowRoot.querySelector('input, textarea, select');
              if (actualInput instanceof HTMLElement) {
                actualInput.focus();
              }
            }
          } else if (inputElement instanceof HTMLElement) {
            inputElement.focus();
          }
        }, 300);
      }
    }
  }, [stepperState?.targetScope, uischema.scope]);

  if (modifiedErrors === 'must be equal to one of the allowed values') {
    modifiedErrors = '';
  }
  const requiredNow =
    required ||
    isRequiredBySchema(props.rootSchema as any, rootData, props.path, {
      strategy: 'bestMatch',
    });

  return (
    <JsonFormRegisterProvider defaultRegisters={undefined}>
      <Visible visible={visible}>
        <FormFieldWrapper
          ref={controlRef}
          className="jsonforms-elements-wrapper"
          id={isStepperReview === true ? `review-base-${path}-element-wrapper` : `${path}-element-wrapper`}
        >
          <GoabFormItem
            requirement={uischema?.options?.componentProps?.requirement ?? (requiredNow ? 'required' : undefined)}
            error={isVisited === true ? modifiedErrors : undefined}
            testId={isStepperReview === true ? `review-base-${path}` : path}
            label={props?.noLabel === true ? '' : labelToUpdate}
            helpText={typeof uischema?.options?.help === 'string' && !isStepperReview ? uischema?.options?.help : ''}
          >
            <InnerComponent
              {...{
                ...props,
                isVisited,
                errors: modifiedErrors,
                setIsVisited: () => {
                  setIsVisited(true);
                },
              }}
            />
          </GoabFormItem>
        </FormFieldWrapper>
      </Visible>
    </JsonFormRegisterProvider>
  );
};
