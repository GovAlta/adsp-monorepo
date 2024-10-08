import React, { useContext, useEffect, useState } from 'react';
import { ControlProps } from '@jsonforms/core';
import { JsonFormContext } from '../../Context';
import { AddressInputs } from './AddressInputs';

import { GoAFormItem, GoAInput, GoASkeleton } from '@abgov/react-components-new';
import { Address, Suggestion } from './types';

import { fetchAddressSuggestions, filterAlbertaAddresses, mapSuggestionToAddress } from './utils';
import { AddressSearch } from './styled-components';

type AddressLookUpProps = ControlProps;

const ADDRESS_PATH = 'api/gateway/v1/address/v1/find';

export const AddressLookUpControl = (props: AddressLookUpProps): JSX.Element => {
  const { data, path, schema, handleChange } = props;
  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';
  const formCtx = useContext(JsonFormContext);
  const formHost = formCtx?.formUrl;
  const formUrl = `${formHost}/${ADDRESS_PATH}`;
  const defaultAddress = {
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: isAlbertaAddress ? 'AB' : '',
    postalCode: '',
    country: 'CAN',
  };
  const [address, setAddress] = useState<Address>(data || defaultAddress);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  const updateFormData = (updatedAddress: Address) => {
    setAddress(updatedAddress);
    handleChange(path, updatedAddress);
  };

  const handleInputChange = (field: string, value: string) => {
    const newAddress = { ...address, [field]: value };
    setAddress(newAddress);
    updateFormData(newAddress);
  };
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length > 2) {
        setLoading(true);
        const suggestions = await fetchAddressSuggestions(formUrl, searchTerm, isAlbertaAddress);
        if (isAlbertaAddress) {
          setSuggestions(filterAlbertaAddresses(suggestions));
        } else {
          setSuggestions(suggestions);
        }
        setLoading(false);
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [searchTerm, formUrl, isAlbertaAddress]);

  const handleDropdownChange = async (value: string) => {
    setSearchTerm(value);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const suggestAddress = mapSuggestionToAddress(suggestion);
    setAddress(suggestAddress);
    handleChange(path, suggestAddress);
    setSuggestions([]);
  };
  return (
    <AddressSearch>
      <GoAFormItem label="">
        <GoAInput
          leadingIcon="search"
          name="address-form-address1"
          testId="address-form-address1"
          ariaLabel={'address-form-address1'}
          placeholder="Start typing the first line of your address"
          value={address?.addressLine1 || ''}
          onChange={(name, value) => handleDropdownChange(value)}
          width="100%"
        />
        {loading && <GoASkeleton type="text" data-testId="loading" key={1} />}
        <ul className="suggestions">
          {suggestions &&
            suggestions.map((suggestion, index) => (
              <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                {`${suggestion.Text}  ${suggestion.Description}`}
              </li>
            ))}
        </ul>
      </GoAFormItem>
      <br />
      <AddressInputs address={address} handleInputChange={handleInputChange} isAlbertaAddress={isAlbertaAddress} />
    </AddressSearch>
  );
};
