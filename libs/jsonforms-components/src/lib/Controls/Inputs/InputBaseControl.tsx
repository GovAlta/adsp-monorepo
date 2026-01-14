import React, { useState, useContext, useEffect } from 'react';
import { GoabFormItem } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { checkFieldValidity, getRequiredIfThen } from '../../util/stringUtils';
import { Visible } from '../../util';
import { JsonFormRegisterProvider } from '../../Context/register';
import { FormFieldWrapper } from './style-component';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from '../FormStepper/context';

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

  let modifiedErrors = checkFieldValidity(props as ControlProps);

  const formStepperCtx = useContext(JsonFormsStepperContext);
  const stepperState = (formStepperCtx as JsonFormsStepperContextProps)?.selectStepperState?.();
  const currentCategory = stepperState?.categories?.[stepperState?.activeId];
  const showReviewLink = currentCategory?.showReviewPageLink;

  const [isVisited, setIsVisited] = useState(skipInitialValidation === true);

  useEffect(() => {
    if (showReviewLink === true && !isStepperReview) {
      setIsVisited(true);
    }
  }, [showReviewLink, isStepperReview]);

  if (modifiedErrors === 'must be equal to one of the allowed values') {
    modifiedErrors = '';
  }

  return (
    <JsonFormRegisterProvider defaultRegisters={undefined}>
      <Visible visible={visible}>
        <FormFieldWrapper>
          <GoabFormItem
            requirement={
              uischema?.options?.componentProps?.requirement ??
              (required || getRequiredIfThen(props).length > 0 ? 'required' : undefined)
            }
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
