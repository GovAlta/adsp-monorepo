import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ControlProps } from '@jsonforms/core';
import { JsonFormContext } from '../../Context';
import { AddressInputs } from './AddressInputs';

import { GoabFormItem, GoabInput, GoabSpinner } from '@abgov/react-components-ds1';
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
import { SetValueOptions, useDebouncedCommit } from '../../util/useDebouncedCommit';
import { Visible } from '../../util';
import { GoabInputOnBlurDetail, GoabInputOnChangeDetail, GoabInputOnKeyPressDetail } from '@abgov/ui-components-common';
import { JsonFormsStepperContext } from '../FormStepper/context/StepperContext';
import { getAddressLookupFieldLabel } from '../../common/Constants';

type AddressLookUpProps = ControlProps;

const ADDRESS_PATH = 'api/gateway/v1/address/v1/find';

const normalizeAddressData = (value: Address | undefined, isAlbertaAddress: boolean): Address => {
  const defaults = isAlbertaAddress
    ? ({ country: 'CA', subdivisionCode: 'AB' } as Address)
    : ({ country: 'CA' } as Address);

  const source = (value || {}) as Address & { provinceState?: string };
  const { provinceState, ...rest } = source;
  const subdivisionCode = rest.subdivisionCode || provinceState;

  return { ...defaults, ...rest, ...(subdivisionCode ? { subdivisionCode } : {}) } as Address;
};

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
  const normalizedData = useMemo(() => normalizeAddressData(data, isAlbertaAddress), [data, isAlbertaAddress]);
  const {
    value: address,
    setValue: setAddress,
    flush: flushAddress,
  } = useDebouncedCommit<Address>(normalizedData, (updatedAddress) => handleChange(path, updatedAddress));
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const requiredFields = (schema as { required: string[] }).required;
  const [dropdownSelected, setDropdownSelected] = useState(false);

  const [activeIndex, setActiveIndex] = useState<number>(0);

  const dropdownRef = useRef<HTMLUListElement>(null);
  const debouncedTerm = useDebounce(searchTerm, 500);

  const abortRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>('');
  const cacheRef = useRef<Map<string, Suggestion[]>>(new Map());

  const spinnerTimerRef = useRef<number | null>(null);

  const handleInputChange = (field: string, value: string, options?: SetValueOptions) => {
    let newValue = value;
    const postalCodeErrorMessage = (schema as { errorMessage?: { properties?: { postalCode?: string } } }).errorMessage
      ?.properties?.postalCode;

    if (field === 'postalCode') {
      const validatePc = validatePostalCode(value);
      setErrors((currentErrors) =>
        handlePostalCodeValidation(validatePc, postalCodeErrorMessage ?? '', value, currentErrors),
      );
      newValue = formatPostalCode(value).toUpperCase();
    } else {
      setErrors((currentErrors) => {
        if (!(field in currentErrors)) {
          return currentErrors;
        }

        const nextErrors = { ...currentErrors };
        delete nextErrors[field];
        return nextErrors;
      });
    }

    const newAddress: Address = { ...address, [field]: newValue };
    if (newValue === '') {
      delete newAddress[field as keyof Address];
    }

    setAddress(newAddress, options);

    // Picking a province isn't typing, so there is nothing to wait for.
    if (field === 'subdivisionCode') {
      flushAddress();
    }
  };

  const renderHelp = () => {
    return <HelpContentComponent {...props} isParent={true} showLabel={false} />;
  };

  const handleAddressLine1Change = (value: string) => {
    setDropdownSelected(false);
    setSearchTerm(value);
    // Mirror the keystroke so the field never renders a stale value, but leave the form data alone
    // until blur or a suggestion is picked. Committing mid-lookup re-renders the whole form while
    // the search is still debouncing, which is what closed the suggestions dropdown.
    handleInputChange('addressLine1', value, { autoCommit: false });
  };

  /* istanbul ignore next */
  const handleSuggestionClick = (suggestion: Suggestion) => {
    const suggestAddress = mapSuggestionToAddress(suggestion);
    setAddress(suggestAddress);
    flushAddress();
    setSuggestions([]);
    setErrors({});
    setDropdownSelected(true);
  };

  const handleRequiredFieldBlur = (name: string, value?: string) => {
    const liveInputValue = value ?? address[name as keyof Address] ?? data?.[name] ?? '';

    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };

      if (liveInputValue.trim() === '') {
        nextErrors[name] = `${getAddressLookupFieldLabel(name)} is required`;
      } else {
        delete nextErrors[name];
      }

      return nextErrors;
    });

    setSuggestions([]);
    setOpen(false);

    if (name === 'addressLine1' && value !== undefined) {
      setAddress({ ...address, addressLine1: value });
    }

    // Leaving the field ends the burst of typing, so push what is there now.
    flushAddress();
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
  /* istanbul ignore next */
  useEffect(() => {
    const q = formatPostalCodeIfNeeded(debouncedTerm.trim());

    // Reset when query is short or dropdown selected
    if (!q || q.length <= 2 || dropdownSelected) {
      abortRef.current?.abort();
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      lastQueryRef.current = '';
      return;
    }

    // Prevent repeated calls for same query
    if (q === lastQueryRef.current) {
      return;
    }
    lastQueryRef.current = q;

    // Serve from cache instantly
    const cached = cacheRef.current.get(q);
    if (cached) {
      setSuggestions(isAlbertaAddress ? filterAlbertaAddresses(cached) : cached);
      setOpen(true);
      setLoading(false);
      return;
    }

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setOpen(true);

    // spinner delay (optional but helps perceived performance)
    if (spinnerTimerRef.current) window.clearTimeout(spinnerTimerRef.current);
    spinnerTimerRef.current = window.setTimeout(() => setLoading(true), 150);

    (async () => {
      try {
        const response = await fetchAddressSuggestions(
          formUrl,
          q,
          isAlbertaAddress,
          { signal: controller.signal }, //update util to accept signal
        );

        const filtered = filterSuggestionsWithoutAddressCount(response);
        const finalList = isAlbertaAddress ? filterAlbertaAddresses(filtered) : filtered;

        cacheRef.current.set(q, finalList);
        setSuggestions(finalList);
        // eslint-disable-next-line
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.error('Address fetch failed:', e);
        }
      } finally {
        if (spinnerTimerRef.current) {
          window.clearTimeout(spinnerTimerRef.current);
          spinnerTimerRef.current = null;
        }
        setLoading(false);
      }
    })();

    return () => {
      controller.abort();
      if (spinnerTimerRef.current) {
        window.clearTimeout(spinnerTimerRef.current);
        spinnerTimerRef.current = null;
      }
    };
  }, [debouncedTerm, dropdownSelected, formUrl, isAlbertaAddress]);

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
    <Visible $visible={visible}>
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
                onChange={(detail: GoabInputOnChangeDetail) => handleAddressLine1Change(detail.value)}
                onBlur={(detail: GoabInputOnBlurDetail) => handleRequiredFieldBlur(detail.name, detail.value)}
                width="100%"
                onKeyPress={(detail: GoabInputOnKeyPressDetail) => {
                  if (open) {
                    const newIndex = handleAddressKeyDown(
                      detail.key,
                      detail.value,
                      activeIndex,
                      suggestions,
                      // Navigating the suggestions must never blank out what has been typed.
                      (val) => typeof val === 'string' && handleInputChange('addressLine1', val),
                      (suggestion) => handleSuggestionClick(suggestion),
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
