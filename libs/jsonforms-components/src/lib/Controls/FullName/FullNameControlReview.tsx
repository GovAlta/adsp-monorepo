import { ControlProps } from '@jsonforms/core';
import { GoabFormItem, GoabGrid } from '@abgov/react-components';
import { TextWrapDiv } from '../AddressLookup/styled-components';
import { withJsonFormsAllOfProps } from '@jsonforms/react';

type FullNameControlReviewProps = ControlProps;

export const FullNameControlReview = (props: FullNameControlReviewProps): JSX.Element => {
  return (
    <div>
      <GoabGrid minChildWidth="0ch" gap="s" mb="m">
        <GoabFormItem label="First name" requirement="required">
          <TextWrapDiv>
            <div data-testid={`firstName-control-${props.id}`}>{props.data?.firstName}</div>
          </TextWrapDiv>
        </GoabFormItem>
        <GoabFormItem label="Middle name">
          <TextWrapDiv>
            <div data-testid={`middleName-control-${props.id}`}>{props.data?.middleName}</div>
          </TextWrapDiv>
        </GoabFormItem>
        <GoabFormItem label="Last name" requirement="required">
          <TextWrapDiv>
            <div data-testid={`lastName-control-${props.id}`}>{props.data?.lastName}</div>
          </TextWrapDiv>
        </GoabFormItem>
      </GoabGrid>
    </div>
  );
};

export const GoAInputBaseFullNameControlReview = withJsonFormsAllOfProps(FullNameControlReview);
