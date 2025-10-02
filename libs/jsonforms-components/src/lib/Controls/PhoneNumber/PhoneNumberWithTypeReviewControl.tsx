import { GoAFormItem, GoAGrid } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsAllOfProps } from '@jsonforms/react';
import { TextWrapDiv } from '../AddressLookup/styled-components';
import { PhoneGrid } from './PhoneNumberWithTypeControl';

type PhoneNumberWithTypeReviewProps = ControlProps;

export const PhoneNumberWithTypeReviewControl = (props: PhoneNumberWithTypeReviewProps): JSX.Element => {
  const { data, id, required } = props;

  return (
    <PhoneGrid>
      <GoAFormItem
        label="Phone number"
        error={required && !data?.number ? 'Phone number is required' : ''}
        requirement={required ? 'required' : undefined}
      >
        <TextWrapDiv>
          <div data-testid={`phone-number-control-${id}`}>{data?.number || ''}</div>
        </TextWrapDiv>
      </GoAFormItem>

      <GoAFormItem
        label="Phone type"
        error={required && !data?.type ? 'Phone type is required' : ''}
        requirement={required ? 'required' : undefined}
      >
        <TextWrapDiv>
          <div data-testid={`phone-type-control-${id}`}>{data?.type || ''}</div>
        </TextWrapDiv>
      </GoAFormItem>
    </PhoneGrid>
  );
};

export const GoAInputBasePhoneNumberWithTypeReviewControl = withJsonFormsAllOfProps(PhoneNumberWithTypeReviewControl);
