import React, { useState } from 'react';
import { GoAFormItem } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { checkFieldValidity, convertToSentenceCase, getLabelText, getRequiredIfThen } from '../../util/stringUtils';
import { Visible } from '../../util';
import { JsonFormRegisterProvider } from '../../Context/register';
import { FormFieldWrapper } from './style-component';

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
  setIsVisited?: () => void;
  skipInitialValidation?: boolean;
}

export const GoAInputBaseControl = (props: ControlProps & WithInput): JSX.Element => {
  const { uischema, visible, label, input, required, errors, path, isStepperReview, skipInitialValidation } = props;
  const InnerComponent = input;
  const labelToUpdate: string = convertToSentenceCase(getLabelText(uischema.scope, label || ''));

  let modifiedErrors = checkFieldValidity(props as ControlProps);
  const [isVisited, setIsVisited] = useState(skipInitialValidation === true);

  if (modifiedErrors === 'must be equal to one of the allowed values') {
    modifiedErrors = '';
  }

  return (
    <JsonFormRegisterProvider defaultRegisters={undefined}>
      <Visible visible={visible}>
        <FormFieldWrapper>
          <GoAFormItem
            requirement={
              uischema?.options?.componentProps?.requirement ??
              (required || getRequiredIfThen(props).length > 0 ? 'required' : 'optional')
            }
            error={isVisited === true ? modifiedErrors : undefined}
            testId={`${isStepperReview === true && 'review-base-'}${path}`}
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
          </GoAFormItem>
        </FormFieldWrapper>
      </Visible>
    </JsonFormRegisterProvider>
  );
};
