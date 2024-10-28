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
  data: Data;
  requiredFields: string[];
  // eslint-disable-next-line
  errors: any;
  handleInputChange: (field: string, value: string) => void;
  handleRequiredFieldBlur: (field: string) => void;
}

export const NameInputs: React.FC<NameInputsProps> = ({
  firstName,
  middleName,
  lastName,
  handleInputChange,
  handleRequiredFieldBlur,
  data,
  requiredFields,
  errors,
}: NameInputsProps): JSX.Element => {
  return (
    <GoAGrid minChildWidth="0ch" gap="s">
      <GoAFormItem
        testId="formitem-first-name"
        label="First Name"
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
          onBlur={(name) => handleRequiredFieldBlur(name)}
          width="100%"
        />
      </GoAFormItem>
      <GoAFormItem
        testId="formitem-middle-name"
        label="Middle Name"
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
        label="Last Name"
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
          onBlur={(name) => handleRequiredFieldBlur(name)}
          width="100%"
        />
      </GoAFormItem>
    </GoAGrid>
  );
};
