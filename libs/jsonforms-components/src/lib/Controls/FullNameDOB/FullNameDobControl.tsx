import React, { useContext, useState } from 'react';
import { ControlProps } from '@jsonforms/core';
import { JsonFormContext } from '../../Context';
import { GoADate, GoADatePicker, GoAFormItem, GoAGrid, GoAInput, GoAInputDate } from '@abgov/react-components-new';
import { NameInputs } from '../FullName/FullNameInputs';
import { onChangeForDateControl, onKeyPressForDateControl, onBlurForDateControl } from '../../util/inputControlUtils';
import { checkFieldValidity } from '../../util/stringUtils';

type DateOfBirthControlProps = ControlProps;

export const FullNameDobReviewControl = (props: DateOfBirthControlProps): JSX.Element => {
  return (
    <>
      <GoAGrid minChildWidth="0ch" gap="s">
        <GoAFormItem label="First Name">
          <div data-testid={`firstName-control-`}>{props.data?.firstName}</div>
        </GoAFormItem>
        <GoAFormItem label="Middle Name (optional)">
          <div data-testid={`middleName-control-`}>{props.data?.middleName}</div>
        </GoAFormItem>
        <GoAFormItem label="Last Name">
          <div data-testid={`lastName-control-`}>{props.data?.lastName}</div>
        </GoAFormItem>
      </GoAGrid>
      <GoAGrid minChildWidth="0ch" gap="s">
        <GoAFormItem label="Date of birth">
          <div data-testid={`dob-control-`}>{props.data?.dateOfBirth}</div>
        </GoAFormItem>
      </GoAGrid>
    </>
  );
};

export const FullNameDobControl = (props: DateOfBirthControlProps): JSX.Element => {
  const { data, path, schema, handleChange, uischema } = props;
  const requiredFields = (schema as { required: string[] }).required;
  const [errors, setErrors] = useState<Record<string, string>>({});

  const defaultNameAndDob = {
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: new Date(),
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

  const updateFormData = (updatedData: string) => {
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

  const handleRequiredFieldBlur = (name: string) => {
    if ((!data?.[name] || data?.[name] === '') && requiredFields.includes(name)) {
      const err = { ...errors };
      err[name] = `${name} is required`;
      setErrors(err);
    } else {
      delete errors[name];
    }
  };

  return (
    <>
      <GoAGrid minChildWidth="0ch" gap="s">
        <GoAFormItem
          label="First Name"
          requirement={schema?.required?.includes('firstName') ? 'required' : undefined}
          error={errors?.['firstName'] ?? ''}
        >
          <GoAInput
            type="text"
            name="firstName"
            testId="name-form-first-name"
            ariaLabel={'name-form-first-name'}
            value={formData.firstName || ''}
            onChange={(name, value) => handleInputChange(name, value)}
            onBlur={(name) => handleRequiredFieldBlur(name)}
            width="100%"
          />
        </GoAFormItem>
        <GoAFormItem
          label="Middle Name (optional)"
          requirement={schema?.required?.includes('middleName') ? 'required' : undefined}
        >
          <GoAInput
            type="text"
            name="middleName"
            testId="name-form-middle-name"
            ariaLabel={'name-form-middle-name'}
            value={formData.middleName || ''}
            onChange={(name, value) => handleInputChange(name, value)}
            width="100%"
          />
        </GoAFormItem>
        <GoAFormItem
          label="Last Name"
          requirement={schema?.required?.includes('lastName') ? 'required' : undefined}
          error={errors?.['lastName'] ?? ''}
        >
          <GoAInput
            type="text"
            name="lastName"
            testId="name-form-last-name"
            ariaLabel={'name-form-last-name'}
            value={formData.lastName || ''}
            onChange={(name, value) => handleInputChange(name, value)}
            onBlur={(name) => handleRequiredFieldBlur(name)}
            width="100%"
          />
        </GoAFormItem>
      </GoAGrid>
      <GoAGrid minChildWidth="0ch" gap="s">
        <GoAFormItem label="Date of Birth" error={errors?.['dateOfBirth'] ?? ''}>
          <GoAInput
            type="date"
            name="dateOfBirth"
            min={validDates().minDate}
            max={validDates().maxDate}
            testId={`dob-form-dateOfBirth`}
            ariaLabel="dob-form-dateOfBirth"
            placeholder="YYYY-MM-DD"
            value={formData?.dateOfBirth}
            onChange={(name, value) => handleDobChange(name, value)}
            onBlur={(name) => handleRequiredFieldBlur(name)}
            width="100%"
          />
        </GoAFormItem>
      </GoAGrid>
    </>
  );
};
