import React, { useContext, useEffect, useRef, useState } from 'react';
import { ControlProps } from '@jsonforms/core';
import { JsonFormContext } from '../../Context';
import { AddressInputs } from './AddressInputs';

import { GoabFormItem, GoabInput, GoabSpinner } from '@abgov/react-components';
import { Address, Suggestion } from './types';
import { handleAddressKeyDown } from './utils';
import {
  fetchAddressSuggestions,
  filterAlbertaAddresses,
  mapSuggestionToAddress,
  filterSuggestionsWithoutAddressCount,
  validatePostalCode,
  handlePostalCodeValidation,
  formatPostalCode,
  formatPostalCodeIfNeeded,
} from './utils';
import { ListItem, SearchBox } from './styled-components';
import { HelpContentComponent } from '../../Additional';
import { useDebounce } from '../../util/useDebounce';
import { Visible } from '../../util';
import { GoabInputOnBlurDetail, GoabInputOnChangeDetail, GoabInputOnKeyPressDetail } from '@abgov/ui-components-common';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';

type AddressLookUpProps = ControlProps;

const ADDRESS_PATH = 'api/gateway/v1/address/v1/find';

export const AddressLookUpControl = (props: AddressLookUpProps): JSX.Element => {
  const { data, path, schema, enabled, handleChange, uischema, visible } = props;

  const isAlbertaAddress = schema?.properties?.subdivisionCode?.const === 'AB';
  const formCtx = useContext(JsonFormContext);
  const formStepperCtx = useContext(JsonFormsStepperContext);
  const formHost = formCtx?.formUrl;
  const formUrl = `${formHost}/${ADDRESS_PATH}`;
  const autocompletion = uischema?.options?.autocomplete !== false;
  const [open, setOpen] = useState(false);
  const addressContainerRef = useRef<HTMLDivElement>(null);

  const label = typeof uischema?.label === 'string' && uischema.label ? uischema.label : '';
  let defaultAddress = {};

  if (isAlbertaAddress) {
    defaultAddress = {
      country: 'CA',
      subdivisionCode: 'AB',
    };
  } else {
    defaultAddress = {
      country: 'CA',
    };
  }

  const [address, setAddress] = useState<Address>(data || defaultAddress);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const requiredFields = (schema as { required: string[] }).required;
  const [dropdownSelected, setDropdownSelected] = useState(false);
  const updateFormData = (updatedAddress: Address) => {
    handleChange(path, updatedAddress);
  };
  const debouncedRenderAddress = useDebounce(searchTerm, 500);

  const [activeIndex, setActiveIndex] = useState<number>(0);

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
    if (!debouncedRenderAddress) return;
    handleInputChange('addressLine1', debouncedRenderAddress);
  }, [debouncedRenderAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchSuggestions = async () => {
      /* istanbul ignore next */
      if (debouncedRenderAddress.length > 2 && dropdownSelected === false) {
        setLoading(true);
        setOpen(true);
        try {
          await fetchAddressSuggestions(formUrl, formatPostalCodeIfNeeded(searchTerm), isAlbertaAddress).then(
            (response) => {
              const suggestions = filterSuggestionsWithoutAddressCount(response);
              if (isAlbertaAddress) {
                setSuggestions(filterAlbertaAddresses(suggestions));
              } else {
                setSuggestions(suggestions);
              }
              setLoading(false);
            }
          );
          // eslint-disable-next-line
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error('Address fetch failed:', error);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setSuggestions([]);
        setOpen(false);
      }
    };

    fetchSuggestions();
  }, [debouncedRenderAddress]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDropdownChange = (value: string) => {
    setSearchTerm(value);
  };

  /* istanbul ignore next */
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
    if (dropdownRef.current && activeIndex !== -1) {
      const activeItem = dropdownRef.current?.querySelector(`li[data-index="${activeIndex}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }, [activeIndex]);

  // Handle focus when navigated from review page
  useEffect(() => {
    const stepperState = formStepperCtx?.selectStepperState?.();
    if (
      stepperState?.targetScope &&
      uischema?.scope &&
      stepperState.targetScope === uischema.scope &&
      addressContainerRef.current
    ) {
      const addressInput = addressContainerRef.current.querySelector('goa-input[name="addressLine1"]');
      if (addressInput) {
        addressContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          if (typeof (addressInput as HTMLElement & { focus?: () => void }).focus === 'function') {
            (addressInput as HTMLElement & { focus?: () => void }).focus();
          }
          const shadowRoot = (addressInput as HTMLElement & { shadowRoot?: ShadowRoot }).shadowRoot;
          if (shadowRoot) {
            const actualInput = shadowRoot.querySelector('input');
            if (actualInput instanceof HTMLElement) {
              actualInput.focus();
            }
          }
        }, 300);
      }
    }
  }, [formStepperCtx, uischema?.scope]);

  const readOnly = uischema?.options?.componentProps?.readOnly ?? false;
  return (
    <Visible visible={visible}>
      <div ref={addressContainerRef}>
        {renderHelp()}
        <h3>{label}</h3>
        <GoabFormItem
          requirement={'required'}
          label={'Street address or P.O. box'}
          error={errors?.['addressLine1'] ?? ''}
          data-testId="form-address-line1"
        >
          <SearchBox>
            <div className="input-container">
              <GoabInput
                leadingIcon={autocompletion && enabled ? 'search' : undefined}
                id="goaInput"
                name="addressLine1"
                testId="address-form-address1"
                readonly={readOnly}
                disabled={!enabled}
                ariaLabel={'address-form-address1'}
                placeholder="Start typing the first line of your address, required."
                value={address?.addressLine1 || ''}
                onChange={(detail: GoabInputOnChangeDetail) => handleDropdownChange(detail.value)}
                onBlur={(detail: GoabInputOnBlurDetail) => handleRequiredFieldBlur(detail.name)}
                width="100%"
                onKeyPress={(detail: GoabInputOnKeyPressDetail) => {
                  if (open) {
                    const newIndex = handleAddressKeyDown(
                      detail.key,
                      detail.value,
                      activeIndex,
                      suggestions,
                      (val) => handleInputChange('addressLine1', val),
                      (suggestion) => handleSuggestionClick(suggestion)
                    );
                    setActiveIndex(newIndex);
                  }
                }}
              />

              {loading && (
                <div className="input-spinner">
                  <GoabSpinner type="infinite" size="small"></GoabSpinner>
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
                      selected={activeIndex}
                      index={index}
                      data-testId={`listItem-${index}`}
                    >
                      {`${suggestion.Text}  ${suggestion.Description}`}
                    </ListItem>
                  ))}
              </ul>
            )}
          </SearchBox>
        </GoabFormItem>
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
    </Visible>
  );
};
