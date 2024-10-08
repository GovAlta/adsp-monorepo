import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddressLookUpControl } from './AddressLookUpControl';
import { fetchAddressSuggestions } from './utils';
import { JsonFormContext } from '../../Context';
import { Suggestion } from './types';
jest.mock('./utils');

describe('AddressLookUpControl', () => {
  const defaultProps = {
    id: 'addressLookup',
    rootSchema: {},
    data: {},
    path: 'address',
    scope: '#/properties/mailingAddressAlberta',
    label: 'Mailing Address',
    enabled: true,
    required: false,
    visible: true,
    uischema: {
      type: 'Control',
      scope: '#/properties/mailingAddressAlberta',
    },
    errors: {},
    schema: {
      properties: {
        mailingAddress: {
          properties: {
            subdivisionCode: { const: 'AB' },
          },
        },
      },
    },
    handleChange: jest.fn(),
  };
  const mockSuggestions: Suggestion[] = [
    {
      Id: '1',
      Text: '123 Main St',
      Highlight: '',
      Cursor: 0,
      Description: 'Calgary, AB, T1X 1A1',
      Next: '',
    },
    {
      Id: '2',
      Text: '456 Elm St',
      Highlight: '',
      Cursor: 0,
      Description: 'Edmonton, AB, T6H 3Y9',
      Next: '',
    },
  ];

  const mockContext = {
    formUrl: 'http://mock-form-url',
  };
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders inputs and suggestions', async () => {
    (fetchAddressSuggestions as jest.Mock).mockResolvedValueOnce(mockSuggestions);
    render(
      <JsonFormContext.Provider value={mockContext}>
        <AddressLookUpControl {...defaultProps} />
      </JsonFormContext.Provider>
    );
    const inputField = screen.getByTestId('address-form-address1');

    fireEvent.change(inputField, { target: { value: '123' } });

    fireEvent(
      inputField,
      new CustomEvent('_change', {
        detail: { name: 'addressLine1', value: '123' },
      })
    );
    expect((inputField as HTMLInputElement).value).toBe('123');
  });

  it('displays no suggestions for less than 3 characters', async () => {
    render(<AddressLookUpControl {...defaultProps} />);

    const input = screen.getByPlaceholderText('Start typing the first line of your address');
    fireEvent.change(input, { target: { value: 'Ma' } });

    await waitFor(() => expect(screen.queryByRole('listitem')).toBeNull());
  });
});
