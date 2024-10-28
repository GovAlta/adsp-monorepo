import React from 'react';
import { ControlProps } from '@jsonforms/core';
import { GoAFormItem, GoAGrid } from '@abgov/react-components-new';

type DateOfBirthReviewControlProps = ControlProps;

export const FullNameDobReviewControl = (props: DateOfBirthReviewControlProps): JSX.Element => {
  const requiredFields = (props.schema as { required: string[] }).required;
  return (
    <>
      <GoAGrid minChildWidth="0ch" gap="s">
        <GoAFormItem label="First Name" requirement={requiredFields?.includes('firstName') ? 'required' : undefined}>
          <div data-testid={`firstName-control-${props.id}`}>{props.data?.firstName}</div>
        </GoAFormItem>
        <GoAFormItem label="Middle Name">
          <div data-testid={`middleName-control-${props.id}`}>{props.data?.middleName}</div>
        </GoAFormItem>
        <GoAFormItem label="Last Name" requirement={requiredFields?.includes('lastName') ? 'required' : undefined}>
          <div data-testid={`lastName-control-${props.id}`}>{props.data?.lastName}</div>
        </GoAFormItem>
      </GoAGrid>
      <GoAGrid minChildWidth="0ch" gap="s">
        <GoAFormItem
          label="Date of birth"
          requirement={requiredFields?.includes('dateOfBirth') ? 'required' : undefined}
        >
          <div data-testid={`dob-control-${props.id}`}>{props.data?.dateOfBirth}</div>
        </GoAFormItem>
      </GoAGrid>
    </>
  );
};
