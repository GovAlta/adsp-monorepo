import React, { useState } from 'react';
import { ControlProps } from '@jsonforms/core';
import { GoADate, GoAFormItem, GoAGrid, GoAInput } from '@abgov/react-components-new';
import { TextWrap, TextWrapDiv } from '../AddressLookup/styled-components';

type DateOfBirthControlProps = ControlProps;

interface Data {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: GoADate;
}

export const FullNameDobControl = (props: DateOfBirthControlProps): JSX.Element => {
  const { data, path, schema, handleChange, enabled } = props;
  const requiredFields = (schema as { required: string[] }).required;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const defaultNameAndDob = {
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: undefined,
  };

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
    handleChange(path, updatedData);
  };

  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    updateFormData(updatedData);
  };
  const handleDobChange = (field: string, value: GoADate) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    updateFormData(updatedData);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRequiredFieldBlur = (name: string, updatedData?: any) => {
    const err = { ...errors };
    if (
      (!data?.[name] || data?.[name] === '') &&
      requiredFields.includes(name) &&
      (!updatedData || updatedData?.[name] === '')
    ) {
      const modifiedName =
        name === 'firstName'
          ? 'First name'
          : name === 'lastName'
          ? 'Last name'
          : name === 'dateOfBirth'
          ? 'Date of birth'
          : '';
      err[name] = `${modifiedName} is required`;
    } else {
      err[name] = '';
    }
    setErrors(err);
  };

  return (
    <>
      <GoAGrid minChildWidth="0ch" gap="s" mb="m">
        <GoAFormItem
          label="First name"
          requirement={schema?.required?.includes('firstName') ? 'required' : undefined}
          error={errors?.['firstName'] ?? ''}
        >
          <GoAInput
            disabled={!enabled}
            type="text"
            name="firstName"
            testId="name-form-first-name"
            ariaLabel={'name-form-first-name'}
            value={formData.firstName || ''}
            onChange={(name, value) => {
              handleInputChange(name, value);
            }}
            onBlur={(name) => {
              handleRequiredFieldBlur(name);
            }}
            width="100%"
          />
        </GoAFormItem>
        <GoAFormItem
          label="Middle name"
          requirement={schema?.required?.includes('middleName') ? 'required' : undefined}
        >
          <GoAInput
            type="text"
            name="middleName"
            disabled={!enabled}
            testId="name-form-middle-name"
            ariaLabel={'name-form-middle-name'}
            value={formData.middleName || ''}
            onChange={(name, value) => handleInputChange(name, value)}
            width="100%"
          />
        </GoAFormItem>
        <GoAFormItem
          label="Last name"
          requirement={schema?.required?.includes('lastName') ? 'required' : undefined}
          error={errors?.['lastName'] ?? ''}
          testId="form-item-last-name"
        >
          <GoAInput
            type="text"
            name="lastName"
            disabled={!enabled}
            testId="name-form-last-name"
            ariaLabel={'name-form-last-name'}
            value={formData.lastName || ''}
            onChange={(name, value) => handleInputChange(name, value)}
            onBlur={(name) => {
              /* istanbul ignore next */
              handleRequiredFieldBlur(name);
            }}
            width="100%"
          />
        </GoAFormItem>
      </GoAGrid>
      <GoAGrid minChildWidth="0ch" gap="s" mb="m">
        <GoAFormItem
          label="Date of birth"
          error={errors?.['dateOfBirth'] ?? ''}
          requirement={requiredFields?.includes('dateOfBirth') ? 'required' : undefined}
        >
          <GoAInput
            type="date"
            name="dateOfBirth"
            disabled={!enabled}
            min={validDates().minDate}
            max={validDates().maxDate}
            testId={`dob-form-dateOfBirth`}
            ariaLabel="dob-form-dateOfBirth"
            placeholder="YYYY-MM-DD"
            value={formData?.dateOfBirth}
            onChange={(name, value) => handleDobChange(name, value)}
            onBlur={(name) => {
              /* istanbul ignore next */
              handleRequiredFieldBlur(name);
            }}
            width="100%"
          />
        </GoAFormItem>
      </GoAGrid>
    </>
  );
};
