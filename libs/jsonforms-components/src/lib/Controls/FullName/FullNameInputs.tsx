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
  /* istanbul ignore next */
  const handleRequiredFieldBlur = (name: string) => {
    if ((!data?.[name] || data?.[name] === '') && requiredFields.includes(name)) {
      const err = { ...errors };
      const modifiedName = name === 'firstName' ? 'First Name' : 'Last Name';
      err[name] = `${modifiedName} is required`;
      setErrors(err);
    } else {
      delete errors[name];
    }
  };
  return (
    <GoAGrid minChildWidth="0ch" gap="s" testId="wrapper">
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
          onBlur={(name) => {
            /* istanbul ignore next */
            handleRequiredFieldBlur(name);
          }}
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
          onBlur={(name) => {
            /* istanbul ignore next */
            handleRequiredFieldBlur(name);
          }}
          width="100%"
        />
      </GoAFormItem>
    </GoAGrid>
  );
};
