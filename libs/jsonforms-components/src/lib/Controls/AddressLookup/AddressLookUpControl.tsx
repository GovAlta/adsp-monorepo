import React, { useContext, useEffect, useState, useRef } from 'react';
import { ControlProps } from '@jsonforms/core';
import { JsonFormContext } from '../../Context';
import { AddressInputs } from './AddressInputs';

import { GoAFormItem, GoAInput, GoASkeleton } from '@abgov/react-components-new';
import { Address, Suggestion } from './types';

import {
  fetchAddressSuggestions,
  filterAlbertaAddresses,
  mapSuggestionToAddress,
  filterSuggestionsWithoutAddressCount,
  validatePostalCode,
} from './utils';
import { SearchBox } from './styled-components';
import { HelpContentComponent } from '../../Additional';

type AddressLookUpProps = ControlProps;

const ADDRESS_PATH = 'api/gateway/v1/address/v1/find';

export const AddressLookUpControl = (props: AddressLookUpProps): JSX.Element => {
  const { data, path, schema, handleChange, uischema } = props;

  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';
  const formCtx = useContext(JsonFormContext);
  const formHost = formCtx?.formUrl;
  const formUrl = `${formHost}/${ADDRESS_PATH}`;
  const autocompletion = uischema?.options?.autocomplete !== false;
  const [open, setOpen] = useState(false);

  const label = typeof uischema?.label === 'string' && uischema.label ? uischema.label : schema?.title;
  const defaultAddress = {
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: isAlbertaAddress ? 'AB' : '',
    postalCode: '',
    country: 'CA',
  };
  const [address, setAddress] = useState<Address>(data || defaultAddress);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [postalCodeErrorMsg, setPostalCodeErrorMsg] = useState('');

  const updateFormData = (updatedAddress: Address) => {
    setAddress(updatedAddress);
    handleChange(path, updatedAddress);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'postalCode') {
      const validatePc = validatePostalCode(value);

      if (!validatePc && value.length >= 5) {
        const postalCodeErrorMessage = (schema as { errorMessage?: { properties?: { postalCode?: string } } })
          .errorMessage?.properties?.postalCode;
        setPostalCodeErrorMsg(postalCodeErrorMessage ?? '');
      } else {
        setPostalCodeErrorMsg('');
      }
    }
    const newAddress = { ...address, [field]: value };

    setAddress(newAddress);
    updateFormData(newAddress);
  };

  const renderHelp = () => {
    return <HelpContentComponent {...props} isParent={true} />;
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length > 2) {
        setLoading(true);
        setOpen(true);
        const response = await fetchAddressSuggestions(formUrl, searchTerm, isAlbertaAddress);
        const suggestions = filterSuggestionsWithoutAddressCount(response);
        if (isAlbertaAddress) {
          setSuggestions(filterAlbertaAddresses(suggestions));
        } else {
          setSuggestions(suggestions);
        }
        setLoading(false);
      } else {
        setSuggestions([]);
        setOpen(false);
      }
    };

    fetchSuggestions();
  }, [searchTerm, formUrl, isAlbertaAddress]);

  const handleDropdownChange = async (value: string) => {
    setSearchTerm(value);
    handleInputChange('addressLine1', value);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const suggestAddress = mapSuggestionToAddress(suggestion);
    setAddress(suggestAddress);
    handleChange(path, suggestAddress);
    setSuggestions([]);
  };
  return (
    <div>
      {renderHelp()}
      <GoAFormItem label={label}>
        <SearchBox>
          <GoAInput
            leadingIcon={autocompletion ? 'search' : undefined}
            name="addressLine1"
            testId="address-form-address1"
            ariaLabel={'address-form-address1'}
            placeholder="Start typing the first line of your address"
            value={address?.addressLine1 || ''}
            onChange={(name, value) => handleDropdownChange(value)}
            width="100%"
          />
          {loading && autocompletion && <GoASkeleton type="text" data-testId="loading" key={1} />}
          {suggestions && autocompletion && (
            <ul className="suggestions" tabIndex={0}>
              {suggestions &&
                autocompletion &&
                open &&
                suggestions.map((suggestion, index) => (
                  <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                    {`${suggestion.Text}  ${suggestion.Description}`}
                  </li>
                ))}
            </ul>
          )}
        </SearchBox>
      </GoAFormItem>
      <br />
      <AddressInputs
        address={address}
        handleInputChange={handleInputChange}
        isAlbertaAddress={isAlbertaAddress}
        postalCodeErrorMsg={postalCodeErrorMsg}
      />
    </div>
  );
};
