import { GoabFormItem } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsAllOfProps } from '@jsonforms/react';
import { TextWrapDiv } from '../AddressLookup/styled-components';

type PhoneNumberReviewControlProps = ControlProps;

export const PhoneNumberReviewControl = (props: PhoneNumberReviewControlProps): JSX.Element => {
  const { data, id, required } = props;

  return (
    <GoabFormItem
      label="Phone number"
      error={required && !data ? 'Phone number is required' : ''}
      requirement={required ? 'required' : undefined}
    >
      <TextWrapDiv>
        <div data-testid={`phone-control-${id}`}>{data || ''}</div>
      </TextWrapDiv>
    </GoabFormItem>
  );
};

export const GoabInputBasePhoneNumberReviewControl = withJsonFormsAllOfProps(PhoneNumberReviewControl);
