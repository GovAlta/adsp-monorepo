import React from 'react';
import { Address } from './types';
import { GoAFormItem, GoAInput, GoAGrid, GoADropdownItem, GoADropdown } from '@abgov/react-components-new';
import { LabelDiv } from './styled-components';

interface AddressInputsProps {
  address: Address;
  handleInputChange: (field: string, value: string) => void;
  isAlbertaAddress?: boolean;
  // eslint-disable-next-line
  errors?: any;
  handleOnBlur: (field: string) => void;
  requiredFields?: string[];
}

export const AddressInputs: React.FC<AddressInputsProps> = ({
  address,
  handleInputChange,
  isAlbertaAddress,
  errors,
  handleOnBlur,
  requiredFields,
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
      <GoAFormItem label="">
        <GoAInput
          name="addressLine2"
          testId="address-form-address2"
          ariaLabel={'address-form-address2'}
          placeholder="Unit number, suite, apartment"
          value={address?.addressLine2 || ''}
          onChange={(name, value) => handleInputChange(name, value)}
          width="100%"
        />
      </GoAFormItem>
      <br />
      <GoAGrid minChildWidth="0ch" gap="s">
        <GoAFormItem
          label="City"
          error={errors?.['municipality'] ?? ''}
          requirement={requiredFields?.includes('municipality') ? 'required' : 'optional'}
        >
          <GoAInput
            name="municipality"
            testId="address-form-city"
            ariaLabel={'address-form-city'}
            value={address?.municipality || ''}
            onChange={(name, value) => handleInputChange(name, value)}
            onBlur={(name, value) => handleOnBlur(name)}
            width="100%"
          />
        </GoAFormItem>
        <GoAFormItem
          label="Postal Code"
          error={errors?.['postalCode'] ?? ''}
          requirement={requiredFields?.includes('postalCode') ? 'required' : 'optional'}
        >
          <GoAInput
            name="postalCode"
            testId="address-form-postal-code"
            ariaLabel={'address-form-postal-code'}
            placeholder="A0A 0A0"
            value={address?.postalCode || ''}
            onChange={(name, value) => handleInputChange(name, value)}
            onBlur={(name, value) => handleOnBlur(name)}
            width="100%"
            maxLength={7}
          />
        </GoAFormItem>
      </GoAGrid>
      <br />
      <GoAGrid minChildWidth="0" gap="s">
        <GoAFormItem label="Province">
          {isAlbertaAddress && <LabelDiv data-testid="address-form-province">Alberta</LabelDiv>}
          {!isAlbertaAddress && (
            <GoADropdown
              name="province"
              testId="address-form-province-dropdown"
              ariaLabel={'address-form-province'}
              value={address?.subdivisionCode || ''}
              onChange={(value) => handleInputChange('province', value)}
              relative={true}
              width="25ch"
            >
              {provinces.map((w) => (
                <GoADropdownItem key={w.value} value={w.value} label={w.label} />
              ))}
            </GoADropdown>
          )}
        </GoAFormItem>
        <GoAFormItem label="Country">
          <LabelDiv data-testid="address-form-country">Canada</LabelDiv>
        </GoAFormItem>
      </GoAGrid>
    </>
  );
};