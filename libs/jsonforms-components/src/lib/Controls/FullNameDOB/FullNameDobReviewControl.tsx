import { GoabFormItem, GoabGrid } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsAllOfProps } from '@jsonforms/react';
import { TextWrapDiv } from '../AddressLookup/styled-components';

type DateOfBirthReviewControlProps = ControlProps;

export const FullNameDobReviewControl = (props: DateOfBirthReviewControlProps): JSX.Element => {
  const { data } = props;
  return (
    <>
      <GoabGrid minChildWidth="0ch" gap="s" mb="m">
        <GoabFormItem
          label="First name"
          error={data?.firstName === undefined ? 'First name is required' : ''}
          requirement="required"
        >
          <TextWrapDiv>
            <div data-testid={`firstName-control-${props.id}`}>{props.data?.firstName}</div>
          </TextWrapDiv>
        </GoabFormItem>
        <GoabFormItem label="Middle name">
          <TextWrapDiv>
            <div data-testid={`middleName-control-${props.id}`}>{props.data?.middleName}</div>
          </TextWrapDiv>
        </GoabFormItem>
        <GoabFormItem
          label="Last name"
          error={data?.lastName === undefined ? 'Last name is required' : ''}
          requirement="required"
        >
          <TextWrapDiv>
            <div data-testid={`lastName-control-${props.id}`}>{props.data?.lastName}</div>
          </TextWrapDiv>
        </GoabFormItem>
      </GoabGrid>
      <GoabGrid minChildWidth="0ch" gap="s">
        <GoabFormItem
          label="Date of birth"
          error={data?.dateOfBirth === undefined ? 'Date of birth is required' : ''}
          requirement="required"
        >
          <TextWrapDiv>
            <div data-testid={`dob-control-${props.id}`}>{props.data?.dateOfBirth}</div>
          </TextWrapDiv>
        </GoabFormItem>
      </GoabGrid>
    </>
  );
};

export const GoAInputBaseFullNameDobControlReview = withJsonFormsAllOfProps(FullNameDobReviewControl);
