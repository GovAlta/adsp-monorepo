import React, { useEffect, useState } from 'react';
import { ControlProps } from '@jsonforms/core';
import { GoAFormItem, GoAGrid } from '@abgov/react-components-new';

type DateOfBirthReviewControlProps = ControlProps;

export const FullNameDobReviewControl = (props: DateOfBirthReviewControlProps): JSX.Element => {
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
    if (requiredFields?.includes('dateOfBirth') && !props.data?.dateOfBirth) {
      err['dateOfBirth'] = `Date of birth is required`;
    }
    setErrors(err);
  }, [props.data, requiredFields]);
  return (
    <>
      <GoAGrid minChildWidth="0ch" gap="s">
        <GoAFormItem
          label="First name"
          requirement={requiredFields?.includes('firstName') ? 'required' : undefined}
          error={errors?.['firstName'] ?? ''}
        >
          <div data-testid={`firstName-control-${props.id}`}>{props.data?.firstName}</div>
        </GoAFormItem>
        <GoAFormItem label="Middle name">
          <div data-testid={`middleName-control-${props.id}`}>{props.data?.middleName}</div>
        </GoAFormItem>
        <GoAFormItem
          label="Last name"
          requirement={requiredFields?.includes('lastName') ? 'required' : undefined}
          error={errors?.['lastName'] ?? ''}
        >
          <div data-testid={`lastName-control-${props.id}`}>{props.data?.lastName}</div>
        </GoAFormItem>
      </GoAGrid>
      <GoAGrid minChildWidth="0ch" gap="s">
        <GoAFormItem
          label="Date of birth"
          requirement={requiredFields?.includes('dateOfBirth') ? 'required' : undefined}
          error={errors?.['dateOfBirth'] ?? ''}
        >
          <div data-testid={`dob-control-${props.id}`}>{props.data?.dateOfBirth}</div>
        </GoAFormItem>
      </GoAGrid>
    </>
  );
};
