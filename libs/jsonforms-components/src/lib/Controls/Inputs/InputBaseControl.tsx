/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useContext, useEffect, useRef } from 'react';
import { GoabFormItem } from '@abgov/react-components-ds1';
import { ControlProps } from '@jsonforms/core';
import { checkFieldValidity, getControlLabelText } from '../../util/stringUtils';
import { Visible } from '../../util';
import { JsonFormRegisterProvider } from '../../Context/register';
import { FormFieldWrapper } from './style-component';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from '../FormStepper/context';
import { isRequiredBySchema } from '../../util/requiredUtil';
import { focusWhenReady, scrollIntoView } from '../../util/focusControl';
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
  input: any;
  noLabel?: boolean;
  isStepperReview?: boolean;
  setIsVisited?: () => void;
  skipInitialValidation?: boolean;
}

const getFormItemLabel = (label: string, noLabel?: boolean): string => {
  if (noLabel === true || label === '') {
    return '';
  }

  return label.trim() === '' ? '\u00A0' : label;
};

export const GoAInputBaseControl = (props: ControlProps & WithInput): JSX.Element => {
  const { uischema, visible, label, input, required, errors, path, isStepperReview, skipInitialValidation } = props;
  const InnerComponent = input;
  const labelToUpdate = getControlLabelText(props);
  const controlRef = useRef<HTMLDivElement>(null);

  const formStepperCtx = useContext(JsonFormsStepperContext);
  const stepperState = (formStepperCtx as JsonFormsStepperContextProps)?.selectStepperState?.();
  const currentCategory = stepperState?.categories?.[stepperState?.activeId];
  const showReviewLink = currentCategory?.showReviewPageLink;

  const [isVisited, setIsVisited] = useState(skipInitialValidation === true);
  const { core } = useJsonForms();
  const rootData = core?.data as any;
  const modifiedErrors = checkFieldValidity(props as ControlProps, rootData);
  useEffect(() => {
    if (showReviewLink === true && !isStepperReview) {
      setIsVisited(true);
    }
  }, [showReviewLink, isStepperReview]);

  const hasValue = (() => {
    const value = props.data;
    return value !== undefined && value !== null && value !== '';
  })();

  useEffect(() => {
    if (!stepperState?.targetScope || stepperState.targetScope !== uischema.scope || !controlRef.current) {
      return;
    }

    const inputElement = controlRef.current.querySelector(
      'input, textarea, select, goa-input, goa-textarea, goa-dropdown, goa-checkbox, goa-radio-group',
    );

    if (!inputElement) {
      return;
    }

    // An instant scroll, not a smooth one. This runs on the Change button's deep link into a long
    // form, where a smooth scroll animates for hundreds of milliseconds before the field is usable
    // — and the focus below has to wait out the animation, because focusing mid-scroll makes the
    // browser jump straight to the element and abandon it.
    scrollIntoView(controlRef.current, { behavior: 'auto', block: 'center' });

    return focusWhenReady(inputElement);
  }, [stepperState?.targetScope, uischema.scope]);

  const requiredNow =
    required ||
    isRequiredBySchema(props.rootSchema as any, rootData, props.path, {
      strategy: 'bestMatch',
    });

  return (
    <JsonFormRegisterProvider defaultRegisters={undefined}>
      <Visible $visible={visible}>
        <FormFieldWrapper
          ref={controlRef}
          className="jsonforms-elements-wrapper"
          id={isStepperReview === true ? `review-base-${path}-element-wrapper` : `${path}-element-wrapper`}
        >
          <GoabFormItem
            requirement={uischema?.options?.componentProps?.requirement ?? (requiredNow ? 'required' : undefined)}
            error={currentCategory?.isNavigatedAway === true || isVisited || hasValue ? modifiedErrors : undefined}
            testId={isStepperReview === true ? `review-base-${path}` : path}
            label={getFormItemLabel(labelToUpdate, props?.noLabel)}
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
