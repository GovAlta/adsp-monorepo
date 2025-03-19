import { ControlProps } from '@jsonforms/core';
import { GoAFormItem, GoAGrid } from '@abgov/react-components';
import { TextWrapDiv } from '../AddressLookup/styled-components';
import { withJsonFormsAllOfProps } from '@jsonforms/react';

type FullNameControlReviewProps = ControlProps;

export const FullNameControlReview = (props: FullNameControlReviewProps): JSX.Element => {
  return (
    <div>
      <GoAGrid minChildWidth="0ch" gap="s" mb="m">
        <GoAFormItem label="First name">
          <TextWrapDiv>
            <div data-testid={`firstName-control-${props.id}`}>{props.data?.firstName}</div>
          </TextWrapDiv>
        </GoAFormItem>
        <GoAFormItem label="Middle name">
          <TextWrapDiv>
            <div data-testid={`middleName-control-${props.id}`}>{props.data?.middleName}</div>
          </TextWrapDiv>
        </GoAFormItem>
        <GoAFormItem label="Last name">
          <TextWrapDiv>
            <div data-testid={`lastName-control-${props.id}`}>{props.data?.lastName}</div>
          </TextWrapDiv>
        </GoAFormItem>
      </GoAGrid>
    </div>
  );
};

export const GoAInputBaseFullNameControlReview = withJsonFormsAllOfProps(FullNameControlReview);
