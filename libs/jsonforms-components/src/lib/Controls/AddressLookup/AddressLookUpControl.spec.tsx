import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddressLookUpControl } from './AddressLookUpControl';
import { fetchAddressSuggestions } from './utils';
import { JsonFormContext } from '../../Context';
import { Suggestion } from './types';
import { isAddressLookup } from './AddressLookupTester';
import { ControlElement, JsonSchema4, JsonSchema7, TesterContext, UISchemaElement } from '@jsonforms/core';

jest.mock('./utils', () => ({
  fetchAddressSuggestions: jest.fn(),
  filterAlbertaAddresses: jest.fn(),
  mapSuggestionToAddress: jest.fn(),
  filterSuggestionsWithoutAddressCount: jest.fn(),
}));
const mockHandleChange = jest.fn();
const formUrl = 'http://mock-form-url.com';
const mockFormContext = {
  formUrl,
};
describe('AddressLookUpControl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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
        <AddressLookUpControl label={''} errors={''} rootSchema={undefined} id={''} enabled={false} visible={false} {...props} />
      </JsonFormContext.Provider>
    );
  };

  const dummyTestContext = {
    rootSchema: {},
    config: {},
  } as TesterContext;

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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should render the component with input fields', () => {
    renderComponent();
    const input = screen.getByTestId('address-form-address1');
    const inputElement = input?.shadowRoot?.querySelector('input');
    expect(inputElement?.placeholder).toBe('Start typing the first line of your address, required.');
  });
  it('should render the input fields with empty values', () => {
    renderComponent();

    const input = screen.getByPlaceholderText('Start typing the first line of your address, required.');
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('renders inputs and suggestions', async () => {
    (fetchAddressSuggestions as jest.Mock).mockResolvedValueOnce(mockSuggestions);
    const handleDropdownChange = jest.fn(() => Promise.resolve());
    renderComponent();
    const inputField = screen.getByTestId('address-form-address1');
    fireEvent.change(inputField, { target: { value: '123' } });
    expect((inputField as HTMLInputElement).value).toBe('123');
  });

  it('displays no suggestions for less than 3 characters', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Start typing the first line of your address, required.');
    fireEvent.change(input, { target: { value: 'Ma' } });

    await waitFor(() => expect(screen.queryByRole('listitem')).toBeNull());
  });

  it('can map the control based on address schema', () => {
    // wrong ui schema type

    expect(
      isAddressLookup(
        {
          type: 'Category',
          scope: '#/properties/personFullName',
        } as UISchemaElement,
        {},
        dummyTestContext
      )
    ).toBe(false);

    // wrong schema type
    expect(
      isAddressLookup(
        {
          type: 'Control',
          scope: '#/properties/albertaAddress',
        } as UISchemaElement,
        {
          type: 'object',
          properties: {
            personFullName: {
              $comment: 'The full name of a person including first, middle, and last names.',
              type: 'object',
              properties: {
                firstName: {
                  $comment: 'The name (first, middle, last, preferred, other, etc.) of a person.',
                  type: 'string',
                  pattern: "^$|^\\p{L}[\\p{L}\\p{M}.'\\- ]{0,58}[\\p{L}.']$",
                },
                middleName: {
                  $comment: 'The name (first, middle, last, preferred, other, etc.) of a person.',
                  type: 'string',
                  pattern: "^$|^\\p{L}[\\p{L}\\p{M}.'\\- ]{0,58}[\\p{L}.']$",
                },
                lastName: {
                  $comment: 'The name (first, middle, last, preferred, other, etc.) of a person.',
                  type: 'string',
                  pattern: "^$|^\\p{L}[\\p{L}\\p{M}.'\\- ]{0,58}[\\p{L}.']$",
                },
              },
              required: ['firstName', 'lastName'],
              errorMessage: {
                properties: {
                  firstName: 'Include period (.) if providing your initial',
                  middleName: 'Include period (.) if providing your initial',
                  lastName: 'Include period (.) if providing your initial',
                },
              },
            } as JsonSchema7,
          },
        },
        dummyTestContext
      )
    ).toBe(false);

    // miss addressLine1
    expect(
      isAddressLookup(
        {
          type: 'Control',
          scope: '#/properties/albertaAddress',
        } as UISchemaElement,
        {
          type: 'object',
          properties: {
            albertaAddress: {
              $comment: 'Postal address in Alberta.',
              title: 'Alberta postal address',
              type: 'object',
              properties: {
                addressLine2: {
                  description: 'Apartment or unit number',
                  allOf: [
                    {
                      type: 'string',
                      $comment:
                        "A portion of an individual's mailing address which identifies a specific location within a municipality.",
                      minLength: 1,
                      maxLength: 60,
                    } as JsonSchema7,
                  ],
                },
                municipality: {
                  type: 'string',
                  $comment: 'The name of a city, town, hamlet, or village.',
                } as JsonSchema7,
                subdivisionCode: {
                  const: 'AB',
                },
                postalCode: {
                  type: 'string',
                  title: 'Postal code',
                  description: 'A0A 0A0',
                  pattern: '^$|^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$',
                },
                country: {
                  const: 'CA',
                },
              },
              required: ['addressLine1', 'municipality', 'postalCode'],
              errorMessage: {
                properties: {
                  postalCode: 'Must be in A0A 0A0 capital letters and numbers format',
                },
              },
            } as JsonSchema7,
          },
        },
        dummyTestContext
      )
    ).toBe(false);

    expect(
      isAddressLookup(
        {
          type: 'Control',
          scope: '#/properties/albertaAddress',
        } as UISchemaElement,
        {
          type: 'object',
          properties: {
            albertaAddress: {
              $comment: 'Postal address in Alberta.',
              title: 'Alberta postal address',
              type: 'object',
              properties: {
                addressLine1: {
                  description: 'Building number and street, or PO box',
                  allOf: [
                    {
                      type: 'string',
                      $comment:
                        "A portion of an individual's mailing address which identifies a specific location within a municipality.",
                      minLength: 1,
                      maxLength: 60,
                    } as JsonSchema7,
                  ],
                },
                addressLine2: {
                  description: 'Apartment or unit number',
                  allOf: [
                    {
                      type: 'string',
                      $comment:
                        "A portion of an individual's mailing address which identifies a specific location within a municipality.",
                      minLength: 1,
                      maxLength: 60,
                    } as JsonSchema7,
                  ],
                },
                municipality: {
                  type: 'string',
                  $comment: 'The name of a city, town, hamlet, or village.',
                },
                subdivisionCode: {
                  const: 'AB',
                },
                postalCode: {
                  type: 'string',
                  title: 'Postal code',
                  description: 'A0A 0A0',
                  pattern: '^$|^[A-Z][0-9][A-Z] [0-9][A-Z][0-9]$',
                },
                country: {
                  $comment: 'The international standard two-letter country code.',
                  const: 'CA',
                },
              },
              required: ['addressLine1', 'municipality', 'postalCode'],
              errorMessage: {
                properties: {
                  postalCode: 'Must be in A0A 0A0 capital letters and numbers format',
                },
              },
            } as JsonSchema7,
          },
        },
        dummyTestContext
      )
    ).toBe(true);
  });
});
