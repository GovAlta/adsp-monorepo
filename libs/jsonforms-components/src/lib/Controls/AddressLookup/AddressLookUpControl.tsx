import React, { useContext, useEffect, useRef, useState } from 'react';
import { ControlProps } from '@jsonforms/core';
import { JsonFormContext } from '../../Context';
import { AddressInputs } from './AddressInputs';

import { GoACircularProgress, GoAFormItem, GoAInput, GoASkeleton } from '@abgov/react-components-new';
import { Address, Suggestion } from './types';

import {
  fetchAddressSuggestions,
  filterAlbertaAddresses,
  mapSuggestionToAddress,
  filterSuggestionsWithoutAddressCount,
  validatePostalCode,
  handlePostalCodeValidation,
  formatPostalCode,
} from './utils';
import { SearchBox } from './styled-components';
import { HelpContentComponent } from '../../Additional';
import axios from 'axios';

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
    municipality: '',
    subdivisionCode: isAlbertaAddress ? 'AB' : '',
    postalCode: '',
    country: 'CA',
  };

  const [address, setAddress] = useState<Address>(data || defaultAddress);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const requiredFields = (schema as { required: string[] }).required;
  const updateFormData = (updatedAddress: Address) => {
    setAddress(updatedAddress);
    handleChange(path, updatedAddress);
  };
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const dropdownRef = useRef<HTMLUListElement>(null);

  const handleInputChange = (field: string, value: string) => {
    let newAddress;
    const postalCodeErrorMessage = (schema as { errorMessage?: { properties?: { postalCode?: string } } }).errorMessage
      ?.properties?.postalCode;

    if (field === 'postalCode') {
      const validatePc = validatePostalCode(value);
      setErrors(
        handlePostalCodeValidation(validatePc, postalCodeErrorMessage ? postalCodeErrorMessage : '', value, errors)
      );
      value = formatPostalCode(value);
      newAddress = { ...address, [field]: value.toUpperCase() };
    } else {
      newAddress = { ...address, [field]: value };
      delete errors[field];
    }

    setAddress(newAddress);
    updateFormData(newAddress);
  };

  const renderHelp = () => {
    return <HelpContentComponent {...props} isParent={true} showLabel={false} />;
  };



  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length > 2) {
        setLoading(true);
        setOpen(true);
        await fetchAddressSuggestions(formUrl, searchTerm, isAlbertaAddress).then((response)=>{
          const suggestions = filterSuggestionsWithoutAddressCount(response);
          if (isAlbertaAddress) {
            setSuggestions(filterAlbertaAddresses(suggestions));
          } else {
            setSuggestions(suggestions);
          }
          setLoading(false);
        })
      } else {
        setSuggestions([]);
        setOpen(false);
      }
    };

    fetchSuggestions();
  }, [searchTerm, formUrl, isAlbertaAddress]);

  const handleDropdownChange = (value: string) => {
    setSearchTerm(value);
    handleInputChange('addressLine1', value);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const suggestAddress = mapSuggestionToAddress(suggestion);
    setAddress(suggestAddress);
    handleChange(path, suggestAddress);
    setSuggestions([]);
    setErrors({});
  };

  const handleRequiredFieldBlur = (name: string) => {
    const err = { ...errors };
    if(data?.["city"] === undefined || data?.["city"] === ""){
      err[name] = name === 'municipality' ? 'city is required' : ""
      setErrors(err);
    }

    if(!data?.[name] || data[name] === '' || data?.[name] === undefined){
      err[name] = name === 'municipality' ? 'city is required' : `${name} is required`;
      setErrors(err);
    }

    if(!data?.[name]){
      err[name] = name === 'addressLine1' ? `${name} is required` : ``;
      setErrors(err);
    }

    else{
      delete errors[name];
    }

    setTimeout(() => {
      setSuggestions([])
      setOpen(false)
    }, 100);
  };

  useEffect(() => {
    if (dropdownRef.current) {
        const selectedItem = dropdownRef.current.children[selectedIndex];
        if (selectedItem) {
          selectedItem.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          });
        }
      }
    }, [selectedIndex, open]);

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prevIndex) =>
            prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0
        );
        handleDropdownChange(e.currentTarget.value)
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prevIndex) =>
            prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1
        );
        handleDropdownChange(e.currentTarget.value)
    } else if (e.key === 'Enter') {
      handleDropdownChange(e.currentTarget.value)
      setLoading(false);
      if (selectedIndex >= 0) {
        document.getElementById("goaInput")?.blur()
        const suggestion = suggestions[selectedIndex];
        if(suggestion){
          setTimeout(() => {
              handleSuggestionClick(suggestion);
              setOpen(false);
            }, 100);
          }
        }
    }
};

  return (
    <div>
      {renderHelp()}
      <GoAFormItem label={label} error={errors?.['addressLine1'] ?? ''} data-testId="form-address-line1">
        <SearchBox
            onKeyDown={(e) => {
              if(open){
                handleKeyDown(e)
              }
            }
          }
        >
          <GoAInput
            id="goaInput"
            leadingIcon={autocompletion ? 'search' : undefined}
            name="addressLine1"
            testId="address-form-address1"
            ariaLabel={'address-form-address1'}
            placeholder="Start typing the first line of your address, required."
            value={address?.addressLine1 || ''}
            onChange={(value) => handleDropdownChange(value)}
            onBlur={(name) => handleRequiredFieldBlur(name)}
            width="100%"
          />
          {loading && autocompletion && <GoACircularProgress variant="inline" size="small" visible={true}></GoACircularProgress> }

          {suggestions && autocompletion && (
            <ul ref={dropdownRef} className="suggestions" tabIndex={0}>
              {suggestions &&
                autocompletion &&
                open &&
                suggestions.map((suggestion, index) => (
                  <li
                  data-index={index}
                  key={index}
                  onClick={() => {
                    handleSuggestionClick(suggestion)
                  }}
                  style={{
                    backgroundColor: selectedIndex === index ? 'var(--color-primary)' : '',
                    color: selectedIndex === index ? ' var(--color-white)' : '',
                    fontWeight :  selectedIndex === index ? 'var(--fw-bold)' : '',
                  }}
                  >
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
        errors={errors}
        handleInputChange={handleInputChange}
        isAlbertaAddress={isAlbertaAddress}
        handleOnBlur={handleRequiredFieldBlur}
        requiredFields={requiredFields}
      />
    </div>
  );
};
