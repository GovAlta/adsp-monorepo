import React, { useEffect, useState } from 'react';
import { GoabFormItem, GoabInput, GoabGrid } from '@abgov/react-components';
import { GoabInputOnChangeDetail, GoabInputOnBlurDetail } from '@abgov/ui-components-common';

interface Data {
  firstName: string;
  middleName: string;
  lastName: string;
}
interface NameInputsProps {
  firstName: string;
  middleName?: string;
  lastName: string;
  isStepperReview?: boolean;
  disabled?: boolean;
  // eslint-disable-next-line
  data?: any;
  requiredFields?: string[];
  errors?: Record<string, string>;
  onFieldBlur?: (name: string) => void;
  // eslint-disable-next-line
  handleInputChange: (field: string, value: string) => void;
}

export const NameInputs: React.FC<NameInputsProps> = ({
  firstName,
  middleName,
  lastName,
  handleInputChange,
  data,
  requiredFields,
  disabled,
  errors,
  onFieldBlur,
}: NameInputsProps): JSX.Element => {
  const [internalErrors, setInternalErrors] = useState<Record<string, string>>({});
  const currentValues = { firstName, middleName: middleName || '', lastName };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      (['firstName', 'middleName', 'lastName'] as const).forEach((field) => {
        const input = document.querySelector<HTMLInputElement>(`goa-input[name="${field}"]`);
        const liveValue = input?.value?.trim() || '';

        if (liveValue && !currentValues[field]) {
          handleInputChange(field, liveValue);
        }
      });
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [firstName, middleName, lastName, handleInputChange]);

  useEffect(() => {
    if (errors) {
      return;
    }

    setInternalErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      let hasChanges = false;

      Object.keys(currentErrors).forEach((name) => {
        const currentValue = (currentValues[name as keyof typeof currentValues] || '').trim();

        if (requiredFields?.includes(name) && currentValue === '') {
          return;
        }

        delete nextErrors[name];
        hasChanges = true;
      });

      return hasChanges ? nextErrors : currentErrors;
    });
  }, [errors, firstName, middleName, lastName, requiredFields]);

  // eslint-disable-next-line
  const handleRequiredFieldBlur = (name: string, updatedData?: any) => {
    const err = { ...internalErrors };
    if (
      (!data?.[name] || data?.[name] === '') &&
      requiredFields?.includes(name) &&
      (!updatedData || updatedData?.[name] === '')
    ) {
      const modifiedName = name === 'firstName' ? 'First name' : name === 'lastName' ? 'Last name' : '';
      err[name] = `${modifiedName} is required`;
    } else {
      err[name] = '';
    }
    setInternalErrors(err);
  };

  const displayedErrors = errors ?? internalErrors;
  const handleBlur = (name: string) => {
    if (onFieldBlur) {
      onFieldBlur(name);
    } else {
      handleRequiredFieldBlur(name);
    }
  };

  return (
    <GoabGrid minChildWidth="0ch" gap="s" mb="m" testId="wrapper">
      <GoabFormItem
        testId="form-item-first-name"
        label="First name"
        requirement={requiredFields?.includes('firstName') ? 'required' : undefined}
        error={displayedErrors?.['firstName'] ?? ''}
      >
        <GoabInput
          type="text"
          name="firstName"
          disabled={disabled}
          testId="name-form-first-name"
          ariaLabel={'name-form-first-name'}
          value={firstName || ''}
          onChange={(detail: GoabInputOnChangeDetail) => handleInputChange(detail.name, detail.value)}
          onBlur={(detail: GoabInputOnBlurDetail) => {
            handleBlur(detail.name);
          }}
          width="100%"
        />
      </GoabFormItem>
      <GoabFormItem
        testId="form-item-middle-name"
        label="Middle name"
        requirement={requiredFields?.includes('middleName') ? 'required' : undefined}
      >
        <GoabInput
          type="text"
          name="middleName"
          disabled={disabled}
          testId="name-form-middle-name"
          ariaLabel={'name-form-middle-name'}
          value={middleName || ''}
          onChange={(detail: GoabInputOnChangeDetail) => handleInputChange(detail.name, detail.value)}
          width="100%"
        />
      </GoabFormItem>
      <GoabFormItem
        testId="form-item-last-name"
        label="Last name"
        requirement={requiredFields?.includes('lastName') ? 'required' : undefined}
        error={displayedErrors?.['lastName'] ?? ''}
      >
        <GoabInput
          type="text"
          name="lastName"
          disabled={disabled}
          testId="name-form-last-name"
          ariaLabel={'name-form-last-name'}
          value={lastName || ''}
          onChange={(detail: GoabInputOnChangeDetail) => handleInputChange(detail.name, detail.value)}
          onBlur={(detail: GoabInputOnBlurDetail) => {
            handleBlur(detail.name);
          }}
          width="100%"
        />
      </GoabFormItem>
    </GoabGrid>
  );
};
