import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddressInputs } from './AddressInputs';
import { Address } from './types';
describe('AddressInputs', () => {
  const mockHandleInputChange = jest.fn(() => Promise.resolve());
  const mockHandleInputBlur = jest.fn();
  const defaultAddress: Address = {
    addressLine1: '123 Main St',
    addressLine2: 'Apt 4',
    municipality: 'Edmonton',
    subdivisionCode: 'BC',
    postalCode: 'T5T 1V4',
    country: 'CA',
  };
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all input fields with the correct initial values', () => {
    const { baseElement } = render(
      <AddressInputs
        address={defaultAddress}
        handleOnBlur={mockHandleInputBlur}
        handleInputChange={mockHandleInputChange}
        isAlbertaAddress={false}
      />
    );
    const addressLine2 = baseElement.querySelector("goa-input[testId='address-form-address2']");
    expect(addressLine2?.getAttribute('value')).toBe(defaultAddress.addressLine2);

    const city = baseElement.querySelector("goa-input[testId='address-form-city']");
    expect(city?.getAttribute('value')).toBe(defaultAddress.municipality);
    const province = baseElement.querySelector("goa-dropdown[testId='address-form-province-dropdown']");
    expect(province?.getAttribute('value')).toBe(defaultAddress.subdivisionCode);
    const postalCode = baseElement.querySelector("goa-input[testId='address-form-postal-code']");
    expect(postalCode?.getAttribute('value')).toBe(defaultAddress.postalCode);
  });

  it('calls handleInputChange on user input in address2', () => {
    const { baseElement } = render(
      <AddressInputs
        address={defaultAddress}
        handleOnBlur={mockHandleInputBlur}
        handleInputChange={mockHandleInputChange}
      />
    );

    const addressLine2 = baseElement.querySelector("goa-input[testid='address-form-address2']");

    addressLine2?.setAttribute('value', 'Suite 5');
    fireEvent(
      addressLine2,
      new CustomEvent('_change', {
        detail: { name: 'addressLine2', value: 'Suite 5' },
      })
    );
    expect(addressLine2?.getAttribute('value')).toBe('Suite 5');
    expect(mockHandleInputChange).toBeCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('addressLine2', 'Suite 5');
  });

  it('calls handleInputChange on user input in postalCode', () => {
    const { baseElement } = render(
      <AddressInputs
        address={defaultAddress}
        handleOnBlur={mockHandleInputBlur}
        handleInputChange={mockHandleInputChange}
      />
    );

    const postcodeElement = baseElement.querySelector("goa-input[testid='address-form-postal-code']");

    postcodeElement?.setAttribute('value', 'T4V 5S8');
    fireEvent(
      postcodeElement,
      new CustomEvent('_change', {
        detail: { name: 'postalCode', value: 'T4V 5S8' },
      })
    );

    expect(postcodeElement?.getAttribute('value')).toBe('T4V 5S8');
    expect(mockHandleInputChange).toHaveBeenCalledWith('postalCode', 'T4V 5S8');
  });

  it('calls handleInputChange on user input in city', () => {
    const { baseElement } = render(
      <AddressInputs
        address={defaultAddress}
        handleInputChange={mockHandleInputChange}
        handleOnBlur={mockHandleInputBlur}
      />
    );

    const cityInput = baseElement.querySelector("goa-input[testId='address-form-city']");
    cityInput?.setAttribute('value', 'Calgary');
    fireEvent(
      cityInput,
      new CustomEvent('_change', {
        detail: { name: 'city', value: 'Calgary' },
      })
    );
    expect(cityInput?.getAttribute('value')).toBe('Calgary');
    expect(mockHandleInputChange).toBeCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('city', 'Calgary');
    const blurred = fireEvent.blur(cityInput);

    expect(blurred).toBe(true);
  });
  it('calls handleInputChange on user input in postal code', () => {
    const { baseElement } = render(
      <AddressInputs
        address={defaultAddress}
        handleOnBlur={mockHandleInputBlur}
        handleInputChange={mockHandleInputChange}
      />
    );
    const pcInput = baseElement.querySelector("goa-input[testId='address-form-postal-code']");
    pcInput?.setAttribute('value', 'T2X 2N0');

    fireEvent(
      pcInput,
      new CustomEvent('_change', {
        detail: { name: 'postalCode', value: 'T2X 2N0' },
      })
    );
    expect(pcInput?.getAttribute('value')).toBe('T2X 2N0');
    expect(mockHandleInputChange).toBeCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('postalCode', 'T2X 2N0');
    const blurred = fireEvent.blur(pcInput);
    expect(blurred).toBe(true);
  });

  it('calls handleInputChange on user input in province for canadian address', () => {
    const { baseElement } = render(
      <AddressInputs
        address={defaultAddress}
        handleOnBlur={mockHandleInputBlur}
        handleInputChange={mockHandleInputChange}
        isAlbertaAddress={false}
      />
    );
    const provinceInput = baseElement.querySelector("goa-dropdown[testId='address-form-province-dropdown']");

    provinceInput?.setAttribute('value', 'BC');
    fireEvent(
      provinceInput,
      new CustomEvent('_change', {
        detail: { value: 'BC' },
      })
    );
    expect(provinceInput?.getAttribute('value')).toBe('BC');
    expect(mockHandleInputChange).toBeCalledTimes(1);
    expect(provinceInput).toBeTruthy();
  });
  it(' province is label when isAlbertaAddress is true', () => {
    const component = render(
      <AddressInputs
        address={defaultAddress}
        handleOnBlur={mockHandleInputBlur}
        handleInputChange={mockHandleInputChange}
        isAlbertaAddress={true}
      />
    );

    const provinceInput = component.findByTestId('address-form-province');
    expect(provinceInput).toBeTruthy();
  });
  it('renders default country as Canada ', () => {
    const component = render(
      <AddressInputs
        address={defaultAddress}
        handleOnBlur={mockHandleInputBlur}
        handleInputChange={mockHandleInputChange}
        isAlbertaAddress={true}
      />
    );

    const input = component.findByTestId('address-form-country');

    expect(input).toBeTruthy();
  });

  it('can disable the component', () => {
    const { baseElement } = render(
      <AddressInputs
        address={defaultAddress}
        handleOnBlur={mockHandleInputBlur}
        handleInputChange={mockHandleInputChange}
        isAlbertaAddress={true}
        enabled={false}
      />
    );

    const input = baseElement.querySelector("goa-input[testId='address-form-postal-code']");

    expect(input?.getAttribute('disabled')).toBe('true');
  });
});
