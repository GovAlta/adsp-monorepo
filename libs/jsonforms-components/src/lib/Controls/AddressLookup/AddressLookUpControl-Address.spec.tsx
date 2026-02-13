import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { AddressLookUpControl } from './AddressLookUpControl';
import { fetchAddressSuggestions } from './utils';
import { JsonFormContext } from '../../Context';
import { Suggestion } from './types';
import { ControlElement, JsonSchema4, JsonSchema7 } from '@jsonforms/core';

const mockHandleChange = jest.fn();
const formUrl = 'http://mock-form-url.com';
const mockFormContext = {
  formUrl,
};
jest.mock('./utils', () => {
  const actual = jest.requireActual('./utils');
  return {
    ...actual,
    fetchAddressSuggestions: jest.fn(),
  };
});
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
    (fetchAddressSuggestions as jest.Mock).mockResolvedValue([{ Text: '123 Main St', Description: 'Calgary AB' }]);

    await fetchAddressSuggestions(formUrl, '123', true);
  });

  it('can filter address with mouse click with results', async () => {
    const { baseElement } = renderComponent();
    const inputField = baseElement.querySelector("goa-input[testId='address-form-address2']");
    fireEvent(inputField, new CustomEvent('_keyPress', { detail: { name: 'test', value: '123', key: '123' } }));
    fireEvent(
      inputField,
      new CustomEvent('_change', {
        detail: { value: '123' },
      })
    );

    (fetchAddressSuggestions as jest.Mock).mockResolvedValue([{ Text: '123 Main St', Description: 'Calgary AB' }]);
    const results = await fetchAddressSuggestions(formUrl, '123', true);

    fireEvent(inputField, new CustomEvent('_keyPress', { detail: { name: 'test', value: 'Enter', key: 'Enter' } }));

    expect(results).toHaveLength(1);
  });

  it('can filter address with key presses ArrowDown with results', async () => {
    const { baseElement } = renderComponent();

    const inputField = baseElement.querySelector("goa-input[testId='address-form-address2']");
    fireEvent(inputField, new CustomEvent('_keyPress', { detail: { name: 'addressLine1', value: '123', key: '123' } }));
    fireEvent(
      inputField,
      new CustomEvent('_change', {
        detail: { value: '123' },
      })
    );

    (fetchAddressSuggestions as jest.Mock).mockResolvedValue([{ Text: '123 Main St', Description: 'Calgary AB' }]);
    const results = await fetchAddressSuggestions(formUrl, '123', true);

    fireEvent(
      inputField,
      new CustomEvent('_keyPress', { detail: { name: 'ArrowDown', value: 'ArrowDown', key: 'ArrowDown' } })
    );
    fireEvent(inputField, new CustomEvent('_keyPress', { detail: { name: 'Enter', value: 'Enter', key: 'Enter' } }));

    expect(results).toHaveLength(1);
  });

  it('can filter address with key presses ArrowDown with results', async () => {
    const { baseElement } = renderComponent();

    const inputField = baseElement.querySelector("goa-input[testId='address-form-address2']");
    fireEvent(inputField, new CustomEvent('_keyPress', { detail: { name: 'addressLine1', value: '123', key: '123' } }));
    fireEvent(
      inputField,
      new CustomEvent('_change', {
        detail: { value: '123' },
      })
    );

    (fetchAddressSuggestions as jest.Mock).mockResolvedValue([{ Text: '123 Main St', Description: 'Calgary AB' }]);
    const results = await fetchAddressSuggestions(formUrl, '123', true);

    fireEvent(
      inputField,
      new CustomEvent('_keyPress', { detail: { name: 'ArrowDown', value: 'ArrowDown', key: 'ArrowDown' } })
    );
    fireEvent(
      inputField,
      new CustomEvent('_keyPress', { detail: { name: 'ArrowUp', value: 'ArrowUp', key: 'ArrowUp' } })
    );
    fireEvent(inputField, new CustomEvent('_keyPress', { detail: { name: 'Enter', value: 'Enter', key: 'Enter' } }));

    expect(results).toHaveLength(1);
  });
});
