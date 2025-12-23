import React from 'react';
import { Address } from './types';
import { GoabFormItem, GoabInput, GoabGrid, GoabDropdownItem, GoabDropdown } from '@abgov/react-components';
import { LabelDiv } from './styled-components';
import {
  GoabInputOnChangeDetail,
  GoabDropdownOnChangeDetail,
  GoabInputOnBlurDetail,
} from '@abgov/ui-components-common';

interface AddressInputsProps {
  address: Address;
  handleInputChange: (field: string, value: string) => void;
  isAlbertaAddress?: boolean;
  readOnly?: boolean;
  // eslint-disable-next-line
  errors?: any;
  handleOnBlur: (field: string) => void;
  requiredFields?: string[];
  enabled?: boolean;
}

export const AddressInputs: React.FC<AddressInputsProps> = ({
  address,
  handleInputChange,
  isAlbertaAddress,
  readOnly,
  errors,
  handleOnBlur,
  requiredFields,
  enabled,
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
      <GoabFormItem label="">
        <GoabInput
          name="addressLine2"
          testId="address-form-address2"
          disabled={!enabled}
          readonly={readOnly}
          ariaLabel={'address-form-address2'}
          placeholder="Unit number, suite, apartment"
          value={address?.addressLine2 || ''}
          onChange={(detail: GoabInputOnChangeDetail) => handleInputChange(detail.name, detail.value)}
          width="100%"
        />
      </GoabFormItem>
      <br />
      <GoabGrid minChildWidth="0ch" gap="s">
        <GoabFormItem
          label="City"
          error={errors?.['municipality'] ?? ''}
          requirement={requiredFields?.includes('municipality') ? 'required' : 'optional'}
        >
          <GoabInput
            name="municipality"
            testId="address-form-city"
            ariaLabel={'address-form-city'}
            disabled={!enabled}
            readonly={readOnly}
            value={address?.municipality || ''}
            onChange={(detail: GoabInputOnChangeDetail) => handleInputChange(detail.name, detail.value)}
            onBlur={(detail: GoabInputOnBlurDetail) => handleOnBlur(detail.name)}
            width="100%"
          />
        </GoabFormItem>
        <GoabFormItem
          label="Postal code"
          error={errors?.postalCode ?? ''}
          requirement={requiredFields?.includes('postalCode') ? 'required' : 'optional'}
        >
          <GoabInput
            name="postalCode"
            testId="address-form-postal-code"
            ariaLabel={'address-form-postal-code'}
            disabled={!enabled}
            readonly={readOnly}
            placeholder="A0A 0A0"
            value={address?.postalCode || ''}
            onChange={(detail: GoabInputOnChangeDetail) => handleInputChange(detail.name, detail.value)}
            onBlur={(detail: GoabInputOnBlurDetail) => handleOnBlur(detail.name)}
            width="100%"
            maxLength={7}
          />
        </GoabFormItem>
      </GoabGrid>
      <br />
      <GoabGrid minChildWidth="0" gap="s">
        <GoabFormItem label="Province">
          {isAlbertaAddress && <LabelDiv data-testid="address-form-province">Alberta</LabelDiv>}
          {!isAlbertaAddress && (
            <GoabDropdown
              name="subdivisionCode"
              disabled={!enabled}
              testId="address-form-province-dropdown"
              ariaLabel={'address-form-province'}
              value={address?.subdivisionCode || ''}
              onChange={(detail: GoabDropdownOnChangeDetail) =>
                handleInputChange('subdivisionCode', detail.value as string)
              }
              width="25ch"
            >
              {provinces.map((w) => (
                <GoabDropdownItem key={w.value} value={w.value} label={w.label} />
              ))}
            </GoabDropdown>
          )}
        </GoabFormItem>
        <GoabFormItem label="Country">
          <LabelDiv data-testid="address-form-country">Canada</LabelDiv>
        </GoabFormItem>
      </GoabGrid>
    </>
  );
};
