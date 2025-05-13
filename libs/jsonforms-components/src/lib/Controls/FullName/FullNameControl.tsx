import React, { useEffect, useState } from 'react';
import { ControlProps, isEnabled } from '@jsonforms/core';
import { GoAFormItem, GoAGrid } from '@abgov/react-components';
import { NameInputs } from './FullNameInputs';
import { TextWrapDiv } from '../AddressLookup/styled-components';
import { Visible } from '../../util';

type FullNameProps = ControlProps;
export const FullNameReviewControl = (props: FullNameProps): JSX.Element => {
  const requiredFields = (props.schema as { required: string[] }).required;
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    const err: Record<string, string> = {};
    if (requiredFields?.includes('firstName') && !props.data?.firstName) {
      err['firstName'] = `First name is required`;
    }
    if (requiredFields?.includes('lastName') && !props.data?.lastName) {
      err['lastName'] = `Last name is required`;
    }
    setErrors(err);
  }, [props.data, requiredFields]);
  return (
    <GoAGrid minChildWidth="0ch" gap="s">
      <GoAFormItem
        label="First Name"
        requirement={requiredFields?.includes('firstName') ? 'required' : undefined}
        error={errors?.['firstName'] ?? ''}
      >
        <TextWrapDiv>
          <div data-testid={`firstName-control-${props.id}`}>{props.data?.firstName}</div>
        </TextWrapDiv>
      </GoAFormItem>
      <GoAFormItem label="Middle Name">
        <TextWrapDiv>
          <div data-testid={`middleName-control-${props.id}`}>{props.data?.middleName}</div>
        </TextWrapDiv>
      </GoAFormItem>
      <GoAFormItem
        label="Last Name"
        requirement={requiredFields?.includes('lastName') ? 'required' : undefined}
        error={errors?.['lastName'] ?? ''}
      >
        <TextWrapDiv>
          <div data-testid={`lastName-control-${props.id}`}>{props.data?.lastName}</div>
        </TextWrapDiv>
      </GoAFormItem>
    </GoAGrid>
  );
};

export const FullNameControl = (props: FullNameProps): JSX.Element => {
  const { data, path, schema, handleChange, enabled, visible } = props;
  const requiredFields = (schema as { required: string[] }).required;
  const defaultName = {};
  const [nameData, setNameData] = useState(data || defaultName);

  const updateFormData = (updatedData: object) => {
    updatedData = Object.fromEntries(Object.entries(updatedData).filter(([_, value]) => value !== ''));
    handleChange(path, updatedData);
  };

  const handleInputChange = (field: string, value: string) => {
    const updatedName = { ...nameData, [field]: value };
    setNameData(updatedName);
    updateFormData(updatedName);
  };

  return (
    <Visible visible={visible}>
      <NameInputs
        firstName={nameData.firstName}
        middleName={nameData.middleName}
        lastName={nameData.lastName}
        handleInputChange={handleInputChange}
        data={data}
        disabled={!enabled}
        requiredFields={requiredFields}
      />
    </Visible>
  );
};
