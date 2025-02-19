import React, { useContext, useEffect, useRef, useState } from 'react';
import { ControlProps } from '@jsonforms/core';
import { JsonFormContext } from '../../Context';
import { AddressInputs } from './AddressInputs';

import { GoAFormItem, GoAInput, GoASpinner } from '@abgov/react-components';
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
import { ListItem, SearchBox } from './styled-components';
import { HelpContentComponent } from '../../Additional';

type AddressLookUpProps = ControlProps;

const ADDRESS_PATH = 'api/gateway/v1/address/v1/find';

export const AddressLookUpControl = (props: AddressLookUpProps): JSX.Element => {
  const { data, path, schema, enabled, handleChange, uischema, rootSchema } = props;

  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';
  const formCtx = useContext(JsonFormContext);
  const formHost = formCtx?.formUrl;
  const formUrl = `${formHost}/${ADDRESS_PATH}`;
  const autocompletion = uischema?.options?.autocomplete !== false;
  const [open, setOpen] = useState(false);

  const label = typeof uischema?.label === 'string' && uischema.label ? uischema.label : '';
  const defaultAddress = {
    subdivisionCode: isAlbertaAddress ? 'AB' : '',
    country: 'CA',
  };

  const [address, setAddress] = useState<Address>(data || defaultAddress);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveSearchTerm, setSaveSearchTerm] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const requiredFields = (schema as { required: string[] }).required;
  const [dropdownSelected, setDropdownSelected] = useState(false);
  const updateFormData = (updatedAddress: Address) => {
    setAddress(updatedAddress);
    handleChange(path, updatedAddress);
  };
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const dropdownRef = useRef<HTMLUListElement>(null);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'addressLine1') {
      setDropdownSelected(false);
    }
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

    if (value === '' && field in newAddress) {
      delete newAddress[field];
    }

    setAddress(newAddress);
    updateFormData(newAddress);
  };

  const renderHelp = () => {
    return <HelpContentComponent {...props} isParent={true} showLabel={false} />;
  };

  useEffect(() => {
    if (saveSearchTerm) {
      handleInputChange('addressLine1', searchTerm);
      setSaveSearchTerm(false);
    }
  }, [saveSearchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length > 2 && dropdownSelected === false) {
        setLoading(true);
        setOpen(true);
        await fetchAddressSuggestions(formUrl, searchTerm, isAlbertaAddress).then((response) => {
          const suggestions = filterSuggestionsWithoutAddressCount(response);
          if (isAlbertaAddress) {
            setSuggestions(filterAlbertaAddresses(suggestions));
          } else {
            setSuggestions(suggestions);
          }
          setLoading(false);
        });
      } else {
        setSuggestions([]);
        setOpen(false);
      }
    };

    fetchSuggestions();
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDropdownChange = (value: string) => {
    setSearchTerm(value);
    setSaveSearchTerm(true);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const suggestAddress = mapSuggestionToAddress(suggestion);
    setAddress(suggestAddress);
    handleChange(path, suggestAddress);
    setSuggestions([]);
    setErrors({});
    setDropdownSelected(true);
  };

  const handleRequiredFieldBlur = (name: string) => {
    const err = { ...errors };
    if (!data?.[name] || data[name] === '' || data?.[name] === undefined) {
      err[name] = name === 'municipality' ? 'city is required' : `${name} is required`;
      setErrors(err);
    } else {
      delete errors[name];
    }
    setSuggestions([]);
    setOpen(false);
  };

  useEffect(() => {
    if (dropdownRef.current && selectedIndex !== -1) {
      const activeItem = dropdownRef.current?.querySelector(`li[data-index="${selectedIndex}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: string, value: string, key: string) => {
    if (key === 'ArrowDown') {
      setSelectedIndex((prevIndex) => (prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0));
      handleInputChange('addressLine1', value);
    } else if (key === 'ArrowUp') {
      setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1));
      handleInputChange('addressLine1', value);
    } else if (key === 'Enter') {
      handleInputChange('addressLine1', value);
      setLoading(false);
      if (selectedIndex >= 0) {
        document.getElementById('goaInput')?.blur();
        const suggestion = suggestions[selectedIndex];
        if (suggestion) {
          setTimeout(() => {
            handleSuggestionClick(suggestion);
            setOpen(false);
          }, 50);
        }
      }
    }
  };

  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  return (
    <div>
      {renderHelp()}
      <h3>{label}</h3>
      <GoAFormItem
        requirement={'required'}
        label={'Street address or P.O. box'}
        error={errors?.['addressLine1'] ?? ''}
        data-testId="form-address-line1"
      >
        <SearchBox>
          <div className="input-container">
            <GoAInput
              leadingIcon={autocompletion && enabled ? 'search' : undefined}
              id="goaInput"
              name="addressLine1"
              testId="address-form-address1"
              readonly={readOnly}
              disabled={!enabled}
              ariaLabel={'address-form-address1'}
              placeholder="Start typing the first line of your address, required."
              value={address?.addressLine1 || ''}
              onChange={(e, value) => handleDropdownChange(value)}
              onBlur={(name) => handleRequiredFieldBlur(name)}
              width="100%"
              onKeyPress={(e: string, value: string, key: string) => {
                if (open) {
                  handleKeyDown(e, value, key);
                }
              }}
            />

            {loading && (
              <div className="input-spinner">
                <GoASpinner type="infinite" size="small"></GoASpinner>
              </div>
            )}
          </div>
          {!loading && suggestions && autocompletion && (
            <ul ref={dropdownRef} className="suggestions">
              {suggestions &&
                autocompletion &&
                open &&
                suggestions.map((suggestion, index) => (
                  <ListItem
                    data-index={index}
                    key={index}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={() => {
                      handleSuggestionClick(suggestion);
                    }}
                    selectedIndex={selectedIndex}
                    index={index}
                  >
                    {`${suggestion.Text}  ${suggestion.Description}`}
                  </ListItem>
                ))}
            </ul>
          )}
        </SearchBox>
      </GoAFormItem>
      <br />
      <AddressInputs
        address={address}
        errors={errors}
        readOnly={readOnly}
        enabled={enabled}
        handleInputChange={handleInputChange}
        isAlbertaAddress={isAlbertaAddress}
        handleOnBlur={handleRequiredFieldBlur}
        requiredFields={requiredFields}
      />
    </div>
  );
};
