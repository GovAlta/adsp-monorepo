import React from 'react';
import { Address } from './types';
import { GoAFormItem, GoAInput, GoAGrid } from '@abgov/react-components-new';

interface AddressInputsProps {
  address: Address;
  handleInputChange: (field: string, value: string) => void;
  isAlbertaAddress?: boolean;
}

export const AddressInputs: React.FC<AddressInputsProps> = ({
  address,
  handleInputChange,
  isAlbertaAddress,
}: AddressInputsProps): JSX.Element => {
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
      <GoAGrid minChildWidth="35ch" gap="m">
        <GoAFormItem label="City">
          <GoAInput
            name="city"
            testId="address-form-city"
            ariaLabel={'address-form-city'}
            value={address?.city || ''}
            onChange={(name, value) => handleInputChange(name, value)}
          />
        </GoAFormItem>
        <GoAFormItem label="Postal Code">
          <GoAInput
            name="postalCode"
            testId="address-form-postal-code"
            ariaLabel={'address-form-postal-code'}
            value={address?.postalCode || ''}
            onChange={(name, value) => handleInputChange(name, value)}
          />
        </GoAFormItem>
        <GoAFormItem label="Province">
          <GoAInput
            name="province"
            testId="address-form-province"
            ariaLabel={'address-form-province'}
            value={isAlbertaAddress ? 'AB' : address?.province || ''}
            onChange={(name, value) => handleInputChange(name, value)}
            disabled={isAlbertaAddress}
          />
        </GoAFormItem>
        <GoAFormItem label="Country">
          <GoAInput
            name="country"
            testId="address-form-country"
            ariaLabel={'address-form-country'}
            value="CAN"
            disabled
            onChange={() => {}}
          />
        </GoAFormItem>
      </GoAGrid>
    </>
  );
};
