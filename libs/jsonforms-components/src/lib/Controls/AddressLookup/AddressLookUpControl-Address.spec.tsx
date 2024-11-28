import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddressLookUpControl } from './AddressLookUpControl';
import { fetchAddressSuggestions } from './utils';
import { JsonFormContext } from '../../Context';
import { Suggestion } from './types';
import { ControlElement, JsonSchema4, JsonSchema7, TesterContext, UISchemaElement } from '@jsonforms/core';
import axios from 'axios';

const mockHandleChange = jest.fn();
const formUrl = 'http://mock-form-url.com';
const mockFormContext = {
  formUrl,
};
describe('AddressLookUpControl', () => {
  const renderComponent = (overrides = {}) => {
    const defaultProps = {
      data: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'CAN',
      },
      enabled: true,
      rootSchema: {} as JsonSchema4,
      id: 'address',
      label: 'Mailing Address',
      visible: true,
      errors: '',
      type: 'Control',
      scope: '#/properties/personFullName',
      path: 'address',
      schema: {
        title: 'Alberta postal address',
        properties: {
          subdivisionCode: {
            const: 'AB',
          },
          required: ['addressLine1', 'municipality', 'postalCode'],
          errorMessage: {
            properties: {
              postalCode: 'Must be in 0A0 A0A capital letters and numbers format',
            },
          },
        },
      } as JsonSchema7,
      uischema: {
        type: 'Control',
        scope: '',
        options: {
          autocomplete: true,
        },
        label: 'Address Lookup',
      } as ControlElement,
      handleChange: mockHandleChange,
    };

    const props = { ...defaultProps, ...overrides };

    return render(
      <JsonFormContext.Provider value={mockFormContext}>
        <AddressLookUpControl {...props} />
      </JsonFormContext.Provider>
    );
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
      Text: '123 Elm St',
      Highlight: '',
      Cursor: 0,
      Description: 'Edmonton, AB, T6H 3Y9',
      Next: '',
    },
  ];

  it('can filterAddressSuggestions with results', async () => {
    const mockResponse = {
      data: {
        Items: mockSuggestions,
      },
    };

    axios.get = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve(mockResponse);
    });
    const results = await fetchAddressSuggestions('test', '123', true);
    console.log('results', results);
  });

  it('can filter addresss with mouse click with results', async () => {
    renderComponent();
    const inputField = screen.getByTestId('address-form-address1');

    fireEvent(inputField, new CustomEvent('_keyPress', { detail: { name: 'test', value: '123', key: '123' } }));
    fireEvent(
      inputField,
      new CustomEvent('_change', {
        detail: { value: '123' },
      })
    );

    const mockResponse = {
      data: {
        Items: mockSuggestions,
      },
    };

    axios.get = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve(mockResponse);
    });
    const results = await fetchAddressSuggestions('test', '123', true);

    fireEvent(inputField, new CustomEvent('_keyPress', { detail: { name: 'test', value: 'Enter', key: 'Enter' } }));

    expect(results).toHaveLength(mockResponse.data.Items.length);
  });

  it('can filter address with key presses ArrowDown with results', async () => {
    renderComponent();
    const inputField = screen.getByTestId('address-form-address1');

    fireEvent(inputField, new CustomEvent('_keyPress', { detail: { name: 'addressLine1', value: '123', key: '123' } }));
    fireEvent(
      inputField,
      new CustomEvent('_change', {
        detail: { value: '123' },
      })
    );

    const mockResponse = {
      data: {
        Items: mockSuggestions,
      },
    };

    axios.get = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve(mockResponse);
    });
    const results = await fetchAddressSuggestions('test', '123', true);

    fireEvent(
      inputField,
      new CustomEvent('_keyPress', { detail: { name: 'ArrowDown', value: 'ArrowDown', key: 'ArrowDown' } })
    );
    fireEvent(inputField, new CustomEvent('_keyPress', { detail: { name: 'Enter', value: 'Enter', key: 'Enter' } }));

    expect(results).toHaveLength(mockResponse.data.Items.length);
  });

  it('can filter address with key presses ArrowDown with results', async () => {
    renderComponent();
    const inputField = screen.getByTestId('address-form-address1');

    fireEvent(inputField, new CustomEvent('_keyPress', { detail: { name: 'addressLine1', value: '123', key: '123' } }));
    fireEvent(
      inputField,
      new CustomEvent('_change', {
        detail: { value: '123' },
      })
    );

    const mockResponse = {
      data: {
        Items: mockSuggestions,
      },
    };

    axios.get = jest.fn().mockImplementationOnce(() => {
      return Promise.resolve(mockResponse);
    });
    const results = await fetchAddressSuggestions('test', '123', true);

    fireEvent(
      inputField,
      new CustomEvent('_keyPress', { detail: { name: 'ArrowDown', value: 'ArrowDown', key: 'ArrowDown' } })
    );
    fireEvent(
      inputField,
      new CustomEvent('_keyPress', { detail: { name: 'ArrowUp', value: 'ArrowUp', key: 'ArrowUp' } })
    );
    fireEvent(inputField, new CustomEvent('_keyPress', { detail: { name: 'Enter', value: 'Enter', key: 'Enter' } }));

    expect(results).toHaveLength(mockResponse.data.Items.length);
  });
});
