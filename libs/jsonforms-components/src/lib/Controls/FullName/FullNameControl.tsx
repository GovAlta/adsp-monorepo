import React, { useContext, useEffect, useState } from 'react';
import { ControlProps } from '@jsonforms/core';
import { JsonFormContext } from '../../Context';
import { GoAFormItem, GoAGrid, GoAInput } from '@abgov/react-components-new';
import { checkFieldValidity } from '../../util/stringUtils';

type FullNameProps = ControlProps;

export const FullNameReviewControl = (props: FullNameProps): JSX.Element => {
  return (
    <GoAGrid minChildWidth="0ch" gap="s">
      <GoAFormItem label="First Name">
        <div data-testid={`firstName-control-${props.id}`}>{props.data?.firstName}</div>
      </GoAFormItem>
      <GoAFormItem label="Middle Name (optional)">
        <div data-testid={`middleName-control-${props.id}`}>{props.data?.middleName}</div>
      </GoAFormItem>
      <GoAFormItem label="Last Name">
        <div data-testid={`lastName-control-${props.id}`}>{props.data?.lastName}</div>
      </GoAFormItem>
    </GoAGrid>
  );
};
export const FullNameControl = (props: FullNameProps): JSX.Element => {
  const { data, path, schema, handleChange, uischema } = props;
  const defaultName = {
    firstName: '',
    middleName: '',
    lastName: '',
  };

  const updateFormData = (updatedData: string) => {
    handleChange(path, updatedData);
  };

  const [nameData, setNameData] = useState(data || defaultName);
  const [errMsg, setErrorMsg] = useState('');
  const errors = (name: string) => {
    const err = checkFieldValidity(props as ControlProps);
    setErrorMsg(err);
  };
  const handleInputChange = (field: string, value: string) => {
    const updatedName = { ...nameData, [field]: value };
    setNameData(updatedName);
    updateFormData(updatedName);
  };

  return (
    <GoAGrid minChildWidth="0ch" gap="s">
      <GoAFormItem
        label="First Name"
        requirement={schema?.required?.includes('firstName') ? 'required' : undefined}
        error={errMsg}
      >
        <GoAInput
          type="text"
          name="firstName"
          testId="name-form-first-name"
          ariaLabel={'name-form-first-name'}
          value={nameData.firstName || ''}
          onChange={(name, value) => handleInputChange(name, value)}
          onKeyPress={(name, value) => errors('firstName')}
          onBlur={(name, value) => errors('firstName')}
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
          value={nameData.middleName || ''}
          onChange={(name, value) => handleInputChange(name, value)}
          width="100%"
        />
      </GoAFormItem>
      <GoAFormItem
        label="Last Name"
        requirement={schema?.required?.includes('lastName') ? 'required' : undefined}
        error={errMsg}
      >
        <GoAInput
          type="text"
          name="lastName"
          testId="name-form-last-name"
          ariaLabel={'name-form-last-name'}
          value={nameData.lastName || ''}
          onChange={(name, value) => handleInputChange(name, value)}
          onKeyPress={(name, value) => errors('lastName')}
          onBlur={(name, value) => errors('lastName')}
          width="100%"
        />
      </GoAFormItem>
    </GoAGrid>
  );
};
