import React, { useState } from 'react';
import { GoAFormItem, GoAInput, GoAGrid } from '@abgov/react-components-new';
import { first } from 'lodash';
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
    <GoAGrid minChildWidth="0ch" gap="s" testId="wrapper">
      <GoAFormItem
        testId="formitem-first-name"
        label="First name"
        requirement={requiredFields?.includes('firstName') ? 'required' : undefined}
        error={errors?.['firstName'] ?? ''}
      >
        <GoAInput
          type="text"
          name="firstName"
          testId="name-form-first-name"
          ariaLabel={'name-form-first-name'}
          value={firstName || ''}
          onChange={(name, value) => handleInputChange(name, value)}
          onBlur={(name) => {
            handleRequiredFieldBlur(name);
          }}
          width="100%"
        />
      </GoAFormItem>
      <GoAFormItem
        testId="formitem-middle-name"
        label="Middle name"
        requirement={requiredFields?.includes('middleName') ? 'required' : undefined}
      >
        <GoAInput
          type="text"
          name="middleName"
          testId="name-form-middle-name"
          ariaLabel={'name-form-middle-name'}
          value={middleName || ''}
          onChange={(name, value) => handleInputChange(name, value)}
          width="100%"
        />
      </GoAFormItem>
      <GoAFormItem
        testId="formitem-last-name"
        label="Last name"
        requirement={requiredFields?.includes('lastName') ? 'required' : undefined}
        error={errors?.['lastName'] ?? ''}
      >
        <GoAInput
          type="text"
          name="lastName"
          testId="name-form-last-name"
          ariaLabel={'name-form-last-name'}
          value={lastName || ''}
          onChange={(name, value) => handleInputChange(name, value)}
          onBlur={(name) => {
            handleRequiredFieldBlur(name);
          }}
          width="100%"
        />
      </GoAFormItem>
    </GoAGrid>
  );
};
