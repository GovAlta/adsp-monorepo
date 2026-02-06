/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef, useContext } from 'react';
import { ControlProps, isEnabled } from '@jsonforms/core';
import { GoabFormItem, GoabGrid } from '@abgov/react-components';
import { NameInputs } from './FullNameInputs';
import { TextWrapDiv } from '../AddressLookup/styled-components';
import { Visible } from '../../util';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from '../FormStepper/context';

type FullNameProps = ControlProps;
export const FullNameReviewControl = (props: FullNameProps): JSX.Element => {
  const requiredFields = (props.schema as { required: string[] }).required;
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    const err: Record<string, string> = {};
    if (requiredFields?.includes('firstName') && !props.data?.firstName) {
      err['firstName'] = `First name is required`;
    }
    if (requiredFields?.includes('lastName') && !props.data?.lastName) {
      err['lastName'] = `Last name is required`;
    }
    setErrors(err);
  }, [props.data, requiredFields]);
  return (
    <GoabGrid minChildWidth="0ch" gap="s">
      <GoabFormItem
        label="First Name"
        requirement={requiredFields?.includes('firstName') ? 'required' : undefined}
        error={errors?.['firstName'] ?? ''}
      >
        <TextWrapDiv>
          <div data-testid={`firstName-control-${props.id}`}>{props.data?.firstName}</div>
        </TextWrapDiv>
      </GoabFormItem>
      <GoabFormItem label="Middle Name">
        <TextWrapDiv>
          <div data-testid={`middleName-control-${props.id}`}>{props.data?.middleName}</div>
        </TextWrapDiv>
      </GoabFormItem>
      <GoabFormItem
        label="Last Name"
        requirement={requiredFields?.includes('lastName') ? 'required' : undefined}
        error={errors?.['lastName'] ?? ''}
      >
        <TextWrapDiv>
          <div data-testid={`lastName-control-${props.id}`}>{props.data?.lastName}</div>
        </TextWrapDiv>
      </GoabFormItem>
    </GoabGrid>
  );
};

export const FullNameControl = (props: FullNameProps): JSX.Element => {
  const { data, path, schema, handleChange, enabled, visible, uischema } = props;
  const requiredFields = (schema as { required: string[] }).required;
  const defaultName = {};
  const [nameData, setNameData] = useState(data || defaultName);
  const controlRef = useRef<HTMLDivElement>(null);

  const formStepperCtx = useContext(JsonFormsStepperContext);
  const stepperState = (formStepperCtx as JsonFormsStepperContextProps)?.selectStepperState?.();

  const updateFormData = (updatedData: object) => {
    updatedData = Object.fromEntries(Object.entries(updatedData).filter(([_, value]) => value !== ''));
    handleChange(path, updatedData);
  };

  const handleInputChange = (field: string, value: string) => {
    const updatedName = { ...nameData, [field]: value };
    setNameData(updatedName);
    updateFormData(updatedName);
  };

  /* istanbul ignore next */
  useEffect(() => {
    if (stepperState?.targetScope && stepperState.targetScope === uischema.scope && controlRef.current) {
      const inputElement = controlRef.current.querySelector('input, goa-input');

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
              const actualInput = shadowRoot.querySelector('input');
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

  return (
    <Visible visible={visible}>
      <div ref={controlRef}>
        <NameInputs
          firstName={nameData.firstName}
          middleName={nameData.middleName}
          lastName={nameData.lastName}
          handleInputChange={handleInputChange}
          data={data}
          disabled={!enabled}
          requiredFields={requiredFields}
        />
      </div>
    </Visible>
  );
};
