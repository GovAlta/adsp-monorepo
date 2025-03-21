import { GoAFormItem, GoAGrid } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsAllOfProps } from '@jsonforms/react';
import { TextWrapDiv } from '../AddressLookup/styled-components';

type DateOfBirthReviewControlProps = ControlProps;

export const FullNameDobReviewControl = (props: DateOfBirthReviewControlProps): JSX.Element => {
  return (
    <>
      <GoAGrid minChildWidth="0ch" gap="s" mb="m">
        <GoAFormItem label="First name" requirement="required">
          <TextWrapDiv>
            <div data-testid={`firstName-control-${props.id}`}>{props.data?.firstName}</div>
          </TextWrapDiv>
        </GoAFormItem>
        <GoAFormItem label="Middle name">
          <TextWrapDiv>
            <div data-testid={`middleName-control-${props.id}`}>{props.data?.middleName}</div>
          </TextWrapDiv>
        </GoAFormItem>
        <GoAFormItem label="Last name" requirement="required">
          <TextWrapDiv>
            <div data-testid={`lastName-control-${props.id}`}>{props.data?.lastName}</div>
          </TextWrapDiv>
        </GoAFormItem>
      </GoAGrid>
      <GoAGrid minChildWidth="0ch" gap="s">
        <GoAFormItem label="Date of birth" requirement="required">
          <TextWrapDiv>
            <div data-testid={`dob-control-${props.id}`}>{props.data?.dateOfBirth}</div>
          </TextWrapDiv>
        </GoAFormItem>
      </GoAGrid>
    </>
  );
};

export const GoAInputBaseFullNameDobControlReview = withJsonFormsAllOfProps(FullNameDobReviewControl);
