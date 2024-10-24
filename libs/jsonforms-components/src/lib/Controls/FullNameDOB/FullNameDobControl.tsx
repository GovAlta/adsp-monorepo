import React, { useContext, useState } from 'react';
import { ControlProps } from '@jsonforms/core';
import { JsonFormContext } from '../../Context';
import { GoAFormItem, GoAInput } from '@abgov/react-components-new';
import { NameInputs } from '../FullName/FullNameInputs';

type DateOfBirthControlProps = ControlProps;

export const FullNameDobControl = (props: DateOfBirthControlProps): JSX.Element => {
  const { data, path, schema, handleChange, uischema } = props;

  const defaultNameAndDob = {
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
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

  return (
    <div>
      <NameInputs
        firstName={formData?.firstName}
        middleName={formData?.middleName}
        lastName={formData?.lastName}
        handleInputChange={handleInputChange}
      />
      <br />
      <GoAFormItem label="Date of Birth">
        <GoAInput
          name="dateOfBirth"
          testId="dob-form-dateOfBirth"
          ariaLabel="dob-form-dateOfBirth"
          placeholder="YYYY-MM-DD"
          value={formData?.dateOfBirth || ''}
          onChange={(name, value) => handleInputChange('dateOfBirth', value)}
          width="100%"
        />
      </GoAFormItem>
    </div>
  );
};
