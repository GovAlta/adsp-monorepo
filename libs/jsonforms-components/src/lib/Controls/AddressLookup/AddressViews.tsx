import React from 'react';
import { GoabFormItem, GoabGrid } from '@abgov/react-components';
import { AddressIndent, TextWrap } from './styled-components';

interface AddressInputsProps {
  data: Record<string, string>;
  isAlbertaAddress?: boolean;
  withoutHeader?: boolean;
}

export const AddressViews: React.FC<AddressInputsProps> = ({
  data,
  isAlbertaAddress,
  withoutHeader,
}: AddressInputsProps): JSX.Element => {
  const provinces = [
    { value: 'AB', label: 'Alberta' },
    { value: 'BC', label: 'British Columbia' },
    { value: 'MB', label: 'Manitoba' },
    { value: 'NB', label: 'New Brunswick' },
    { value: 'NL', label: 'Newfoundland and Labrador' },
    { value: 'NS', label: 'Nova Scotia' },
    { value: 'NT', label: 'Northwest Territories' },
    { value: 'NU', label: 'Nunavut' },
    { value: 'ON', label: 'Ontario' },
    { value: 'PE', label: 'Prince Edward Island' },
    { value: 'QC', label: 'Quebec' },
    { value: 'SK', label: 'Saskatchewan' },
    { value: 'YT', label: 'Yukon' },
  ];

  return (
    <>
      {withoutHeader !== true && (
        <GoabGrid minChildWidth="0" gap="s">
          <GoabFormItem label={`${isAlbertaAddress ? 'Alberta' : 'Canada'} postal address`}></GoabFormItem>
        </GoabGrid>
      )}
      <AddressIndent>
        <GoabGrid minChildWidth="0" gap="s">
          <GoabFormItem
            label="Address line 1"
            error={data?.addressLine1 === undefined ? 'Address line 1 is required' : ''}
            requirement="required"
          >
            <TextWrap>{data?.addressLine1}</TextWrap>
          </GoabFormItem>
          {data?.addressLine2 && (
            <GoabFormItem label="Address line 2">
              <TextWrap>{data.addressLine2}</TextWrap>
            </GoabFormItem>
          )}
        </GoabGrid>
        <br />
        <GoabGrid minChildWidth="0ch" gap="s">
          <GoabFormItem
            error={data?.municipality === undefined ? 'City is required' : ''}
            label="City"
            requirement="required"
          >
            <TextWrap>{data?.municipality}</TextWrap>
          </GoabFormItem>
          <GoabFormItem
            error={data?.postalCode === undefined ? 'Postal code is required' : ''}
            label="Postal Code"
            requirement="required"
          >
            <TextWrap>{data?.postalCode}</TextWrap>
          </GoabFormItem>
        </GoabGrid>
        <br />
        <GoabGrid minChildWidth="0" gap="s">
          <GoabFormItem
            label="Province"
            error={!isAlbertaAddress && data?.subdivisionCode === undefined ? 'Province is required' : ''}
            requirement="required"
          >
            {isAlbertaAddress && <div data-testid="address-form-province-view">Alberta</div>}
            {!isAlbertaAddress && (
              <div data-testid="address-form-province-view">
                {provinces.find((p) => p.value === data?.subdivisionCode)?.label}
              </div>
            )}
          </GoabFormItem>
          <GoabFormItem label="Country">
            <div data-testid="address-form-country">Canada</div>
          </GoabFormItem>
        </GoabGrid>
      </AddressIndent>
    </>
  );
};
