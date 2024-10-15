import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddressInputs } from './AddressInputs';
import { Address } from './types';
describe('AddressInputs', () => {
  const mockHandleInputChange = jest.fn(() => Promise.resolve());

  const defaultAddress: Address = {
    addressLine1: '123 Main St',
    addressLine2: 'Apt 4',
    city: 'Edmonton',
    province: 'BC',
    postalCode: 'T5T 1V4',
    country: 'CA',
  };
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all input fields with the correct initial values', () => {
    const component = render(
      <AddressInputs address={defaultAddress} handleInputChange={mockHandleInputChange} isAlbertaAddress={false} />
    );
    const addressLine2 = component.getByTestId('address-form-address2');
    expect((addressLine2 as HTMLInputElement).value).toBe(defaultAddress.addressLine2);
    const city = component.getByTestId('address-form-city');
    expect((city as HTMLInputElement).value).toBe(defaultAddress.city);
    const province = component.getByTestId('address-form-province-dropdown');
    expect((province as HTMLInputElement).value).toBe(defaultAddress.province);
    const postalCode = component.getByTestId('address-form-postal-code');
    expect((postalCode as HTMLInputElement).value).toBe(defaultAddress.postalCode);
  });

  it('calls handleInputChange on user input in address2', () => {
    render(<AddressInputs address={defaultAddress} handleInputChange={mockHandleInputChange} />);

    const addressLine2Input = screen.getByTestId('address-form-address2');
    fireEvent.change(addressLine2Input, { target: { value: 'Suite 5' } });

    fireEvent(
      addressLine2Input,
      new CustomEvent('_change', {
        detail: { name: 'addressLine2', value: 'Suite 5' },
      })
    );
    expect((addressLine2Input as HTMLInputElement).value).toBe('Suite 5');
    expect(mockHandleInputChange).toBeCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('addressLine2', 'Suite 5');
  });
  it('calls handleInputChange on user input in city', () => {
    render(<AddressInputs address={defaultAddress} handleInputChange={mockHandleInputChange} />);

    const cityInput = screen.getByTestId('address-form-city');
    fireEvent.change(cityInput, { target: { value: 'Calgary' } });
    fireEvent(
      cityInput,
      new CustomEvent('_change', {
        detail: { name: 'city', value: 'Calgary' },
      })
    );
    expect((cityInput as HTMLInputElement).value).toBe('Calgary');
    expect(mockHandleInputChange).toBeCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('city', 'Calgary');
  });
  it('calls handleInputChange on user input in postal code', () => {
    render(<AddressInputs address={defaultAddress} handleInputChange={mockHandleInputChange} />);

    const pcInput = screen.getByTestId('address-form-postal-code');
    fireEvent.change(pcInput, { target: { value: 'T2X 2N0' } });
    fireEvent(
      pcInput,
      new CustomEvent('_change', {
        detail: { name: 'postalCode', value: 'T2X 2N0' },
      })
    );
    expect((pcInput as HTMLInputElement).value).toBe('T2X 2N0');
    expect(mockHandleInputChange).toBeCalledTimes(1);
    expect(mockHandleInputChange).toHaveBeenCalledWith('postalCode', 'T2X 2N0');
  });
  it('calls handleInputChange on user input in province for canadian address', () => {
    render(
      <AddressInputs address={defaultAddress} handleInputChange={mockHandleInputChange} isAlbertaAddress={false} />
    );

    const provinceInput = screen.getByTestId('address-form-province-dropdown');

    expect((provinceInput as HTMLInputElement).value).toBe('BC');
    expect(provinceInput).toBeTruthy();
  });
  it(' province is label when isAlbertaAddress is true', () => {
    const component = render(
      <AddressInputs address={defaultAddress} handleInputChange={mockHandleInputChange} isAlbertaAddress={true} />
    );

    const provinceInput = component.getByTestId('address-form-province');
    expect(provinceInput).toBeTruthy();
  });
  it('renders default country as Canada ', () => {
    const component = render(
      <AddressInputs address={defaultAddress} handleInputChange={mockHandleInputChange} isAlbertaAddress={true} />
    );

    const input = component.getByTestId('address-form-country');

    expect(input).toBeTruthy();
  });
  it('matches snapshot', () => {
    const { asFragment } = render(
      <AddressInputs address={defaultAddress} handleInputChange={mockHandleInputChange} isAlbertaAddress={true} />
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
