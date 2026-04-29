/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoabFormItem, GoabGrid, GoabInput } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { useState, useRef, useEffect, useContext } from 'react';
import { useSyncAutofillFields } from '../../util/useSyncAutofillFields';
import { Visible, ensureGoaDatePointerCursor } from '../../util';
import { GoabInputOnChangeDetail, GoabInputOnBlurDetail } from '@abgov/ui-components-common';
import { JsonFormsStepperContext, JsonFormsStepperContextProps } from '../FormStepper/context';
import { NameInputs } from '../FullName/FullNameInputs';

type DateOfBirthControlProps = ControlProps;
type NameDobData = ReturnType<typeof normalizeNameDobData>;
const AUTOFILL_FIELDS = ['firstName', 'middleName', 'lastName', 'dateOfBirth'];
const getRequiredLabel = (name: string) =>
  name === 'firstName' ? 'First name' : name === 'lastName' ? 'Last name' : name === 'dateOfBirth' ? 'Date of birth' : name;

const normalizeNameDobData = (value?: Record<string, unknown>) => ({
  firstName: (value?.firstName as string) || '',
  middleName: (value?.middleName as string) || '',
  lastName: (value?.lastName as string) || '',
  dateOfBirth: (value?.dateOfBirth as string) || '',
});

export const FullNameDobControl = (props: DateOfBirthControlProps): JSX.Element => {
  const { data, path, schema, handleChange, enabled, visible, uischema } = props;
  const requiredFields = ((schema as { required?: string[] }).required || []) as string[];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const controlRef = useRef<HTMLDivElement>(null);

  const formStepperCtx = useContext(JsonFormsStepperContext);
  const stepperState = (formStepperCtx as JsonFormsStepperContextProps)?.selectStepperState?.();

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

  const [formData, setFormData] = useState(normalizeNameDobData(data));

  const updateFormData = (updatedData: NameDobData) => {
    const nextData = Object.fromEntries(Object.entries(updatedData).filter(([_, value]) => value !== '')) as NameDobData;
    setFormData(nextData);
    handleChange(path, nextData);
  };

  useEffect(() => {
    const nextData = normalizeNameDobData(data);
    setFormData((currentData) =>
      currentData.firstName === nextData.firstName &&
      currentData.middleName === nextData.middleName &&
      currentData.lastName === nextData.lastName &&
      currentData.dateOfBirth === nextData.dateOfBirth
        ? currentData
        : nextData,
    );
  }, [data]);

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
      err[name] = `${getRequiredLabel(name)} is required`;
    } else {
      delete err[name];
    }

    setErrors(err);
  };
  useSyncAutofillFields(
    AUTOFILL_FIELDS,
    formData,
    updateFormData,
    handleRequiredFieldBlur,
  );
  useEffect(() => {
    const host = controlRef.current?.querySelector<HTMLElement>('goa-input[type="date"]') ?? null;
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
        <NameInputs
          firstName={formData.firstName}
          middleName={formData.middleName}
          lastName={formData.lastName}
          handleInputChange={handleInputChange}
          data={formData}
          disabled={!enabled}
          requiredFields={requiredFields}
          errors={errors}
          onFieldBlur={handleRequiredFieldBlur}
        />
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
