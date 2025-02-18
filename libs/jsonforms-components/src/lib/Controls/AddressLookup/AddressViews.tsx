import React from 'react';
import { GoAFormItem, GoAGrid } from '@abgov/react-components-new';
import { AddressIndent, TextWrap } from './styled-components';

interface AddressInputsProps {
  data: Record<string, string>;
  isAlbertaAddress?: boolean;
}

export const AddressViews: React.FC<AddressInputsProps> = ({
  data,
  isAlbertaAddress,
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
      <GoAGrid minChildWidth="0" gap="s">
        <GoAFormItem label={`${isAlbertaAddress ? 'Alberta' : 'Canada'} postal address`}></GoAFormItem>
      </GoAGrid>
      <AddressIndent>
        <GoAGrid minChildWidth="0" gap="s">
          <GoAFormItem
            label="Address line 1"
            error={data?.addressLine1 === undefined ? 'addressLine1 is required' : ''}
          >
            <TextWrap>{data?.addressLine1}</TextWrap>
          </GoAFormItem>
          {data?.addressLine2 && (
            <GoAFormItem label="Address line 2">
              <TextWrap>{data.addressLine2}</TextWrap>
            </GoAFormItem>
          )}
        </GoAGrid>
        <br />
        <GoAGrid minChildWidth="0ch" gap="s">
          <GoAFormItem error={data?.municipality === undefined ? 'city is required' : ''} label="City">
            <TextWrap>{data?.municipality}</TextWrap>
          </GoAFormItem>
          <GoAFormItem error={data?.postalCode === undefined ? 'postalCode is required' : ''} label="Postal Code">
            <TextWrap>{data?.postalCode}</TextWrap>
          </GoAFormItem>
        </GoAGrid>
        <br />
        <GoAGrid minChildWidth="0" gap="s">
          <GoAFormItem
            label="Province"
            error={!isAlbertaAddress && data?.subdivisionCode === undefined ? 'Province is required' : ''}
          >
            {isAlbertaAddress && <div data-testid="address-form-province-view">Alberta</div>}
            {!isAlbertaAddress && (
              <div data-testid="address-form-province-view">
                {provinces.find((p) => p.value === data?.subdivisionCode)?.label}
              </div>
            )}
          </GoAFormItem>
          <GoAFormItem label="Country">
            <div data-testid="address-form-country">Canada</div>
          </GoAFormItem>
        </GoAGrid>
      </AddressIndent>
    </>
  );
};
