import React, { useState } from 'react';
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
  data: any;
  requiredFields: string[];
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
}: NameInputsProps): JSX.Element => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // eslint-disable-next-line
  const handleRequiredFieldBlur = (name: string, updatedData?: any) => {
    const err = { ...errors };
    if (
      (!data?.[name] || data?.[name] === '') &&
      requiredFields.includes(name) &&
      (!updatedData || updatedData?.[name] === '')
    ) {
      const modifiedName = name === 'firstName' ? 'First name' : name === 'lastName' ? 'Last name' : '';
      err[name] = `${modifiedName} is required`;
    } else {
      err[name] = '';
    }
    setErrors(err);
  };

  return (
    <GoabGrid minChildWidth="0ch" gap="s" mb="m" testId="wrapper">
      <GoabFormItem
        testId="form-item-first-name"
        label="First name"
        requirement={requiredFields?.includes('firstName') ? 'required' : undefined}
        error={errors?.['firstName'] ?? ''}
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
            handleRequiredFieldBlur(detail.name);
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
        error={errors?.['lastName'] ?? ''}
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
            handleRequiredFieldBlur(detail.name);
          }}
          width="100%"
        />
      </GoabFormItem>
    </GoabGrid>
  );
};
