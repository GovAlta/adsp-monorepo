/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoabFormItem, GoabGrid, GoabInput } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { useState, useRef, useEffect, useContext } from 'react';
import { useSyncAutofillFields } from '../../util/useSyncAutofillFields';
import { Visible, ensureGoaDatePointerCursor } from '../../util';
import { GoabInputOnChangeDetail, GoabInputOnBlurDetail } from '@abgov/ui-components-common';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from '../FormStepper/context';

type DateOfBirthControlProps = ControlProps;

export const FullNameDobControl = (props: DateOfBirthControlProps): JSX.Element => {
  const { data, path, schema, handleChange, enabled, visible, uischema } = props;
  const requiredFields = (schema as { required: string[] }).required;
  const [errors, setErrors] = useState<Record<string, string>>({});
  const controlRef = useRef<HTMLDivElement>(null);

  const formStepperCtx = useContext(JsonFormsStepperContext);
  const stepperState = (formStepperCtx as JsonFormsStepperContextProps)?.selectStepperState?.();

  const defaultNameAndDob = {};
  const validDates = () => {
    const currentDate = new Date();
    const minDate = new Date(currentDate.getFullYear() - 150, currentDate.getMonth(), currentDate.getDate())
      .toISOString()
      .substring(0, 10);
    return {
      minDate,
      maxDate: currentDate.toISOString().substring(0, 10),
    };
  };

  const [formData, setFormData] = useState(data || defaultNameAndDob);

  const updateFormData = (updatedData: object) => {
    updatedData = Object.fromEntries(Object.entries(updatedData).filter(([_, value]) => value !== ''));
    setFormData(updatedData);
    handleChange(path, updatedData);
  };

  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    updateFormData(updatedData);
  };

  // eslint-disable-next-line
  const handleRequiredFieldBlur = (name: string, updatedData?: Record<string, string>) => {
    const err = { ...errors };

    const liveInputValue =
      updatedData?.[name] ??
      data?.[name] ??
      document.querySelector<HTMLInputElement>(`goa-input[name="${name}"]`)?.value ??
      '';

    if (requiredFields.includes(name) && liveInputValue.trim() === '') {
      const modifiedName =
        name === 'firstName'
          ? 'First name'
          : name === 'lastName'
          ? 'Last name'
          : name === 'dateOfBirth'
          ? 'Date of birth'
          : name;
      err[name] = `${modifiedName} is required`;
    } else {
      delete err[name];
    }

    setErrors(err);
  };
  useSyncAutofillFields(
    ['firstName', 'middleName', 'lastName', 'dateOfBirth'],
    formData,
    updateFormData,
    handleRequiredFieldBlur
  );
  const hostRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const host = hostRef.current ?? document.querySelector('goa-input[type="date"]');
    host?.shadowRoot?.querySelector('input[type="date"]');
    ensureGoaDatePointerCursor(host);
  }, []);

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
        <GoabGrid minChildWidth="0ch" gap="s" mb="m">
          <GoabFormItem
            label="First name"
            requirement={schema?.required?.includes('firstName') ? 'required' : undefined}
            error={errors?.['firstName'] ?? ''}
            testId="form-item-first-name"
          >
            <GoabInput
              disabled={!enabled}
              type="text"
              name="firstName"
              testId="name-form-first-name"
              ariaLabel={'name-form-first-name'}
              value={formData.firstName}
              onChange={(detail: GoabInputOnChangeDetail) => {
                handleInputChange(detail.name, detail.value);
              }}
              onBlur={(detail: GoabInputOnBlurDetail) => {
                handleRequiredFieldBlur(detail.name);
              }}
              width="100%"
            />
          </GoabFormItem>
          <GoabFormItem
            label="Middle name"
            requirement={schema?.required?.includes('middleName') ? 'required' : undefined}
          >
            <GoabInput
              type="text"
              name="middleName"
              disabled={!enabled}
              testId="name-form-middle-name"
              ariaLabel={'name-form-middle-name'}
              value={formData.middleName || ''}
              onChange={(detail: GoabInputOnChangeDetail) => handleInputChange(detail.name, detail.value)}
              width="100%"
            />
          </GoabFormItem>
          <GoabFormItem
            label="Last name"
            requirement={schema?.required?.includes('lastName') ? 'required' : undefined}
            error={errors?.['lastName'] ?? ''}
            testId="form-item-last-name"
          >
            <GoabInput
              type="text"
              name="lastName"
              disabled={!enabled}
              testId="name-form-last-name"
              ariaLabel={'name-form-last-name'}
              value={formData.lastName || ''}
              onChange={(detail: GoabInputOnChangeDetail) => {
                handleInputChange(detail.name, detail.value);
              }}
              onBlur={(detail: GoabInputOnBlurDetail) => {
                handleRequiredFieldBlur(detail.name);
              }}
              width="100%"
            />
          </GoabFormItem>
        </GoabGrid>
        <GoabGrid minChildWidth="0ch" gap="s" mb="m">
          <GoabFormItem
            label="Date of birth"
            error={errors?.['dateOfBirth'] ?? ''}
            requirement={requiredFields?.includes('dateOfBirth') ? 'required' : undefined}
          >
            <GoabInput
              type="date"
              name="dateOfBirth"
              disabled={!enabled}
              min={validDates().minDate}
              max={validDates().maxDate}
              testId={`dob-form-dateOfBirth`}
              ariaLabel="dob-form-dateOfBirth"
              placeholder="YYYY-MM-DD"
              value={formData?.dateOfBirth}
              onChange={(detail: GoabInputOnChangeDetail) => handleInputChange(detail.name, detail.value)}
              onBlur={(detail: GoabInputOnBlurDetail) => {
                /* istanbul ignore next */
                handleRequiredFieldBlur(detail.name);
              }}
              width="100%"
            />
          </GoabFormItem>
        </GoabGrid>
      </div>
    </Visible>
  );
};
