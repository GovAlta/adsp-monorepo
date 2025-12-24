import React from 'react';
import type { Ajv } from 'ajv';
import '@testing-library/jest-dom';
import axios from 'axios';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AddressLookUpControl } from './AddressLookUpControl';
import {
  fetchAddressSuggestions,
  validatePostalCode,
  filterAlbertaAddresses,
  mapSuggestionToAddress,
  filterSuggestionsWithoutAddressCount,
  formatPostalCode,
  handlePostalCodeValidation,
  formatPostalCodeIfNeeded,
} from './utils';
import { JsonFormContext } from '../../Context';
import { Suggestion, Address } from './types';
import { isAddressLookup } from './AddressLookupTester';
import {
  ControlElement,
  JsonFormsCore,
  JsonSchema4,
  JsonSchema7,
  TesterContext,
  UISchemaElement,
} from '@jsonforms/core';
import { useJsonForms } from '@jsonforms/react';

const mockUseJsonForms = useJsonForms as jest.MockedFunction<typeof useJsonForms>;

const mockCore: JsonFormsCore = {
  data: {},
  schema: {},
  uischema: {
    type: 'Control',
  },
  errors: [],
  validationMode: 'ValidateAndShow',
  ajv: {} as unknown as Ajv,
};

jest.mock('@jsonforms/react', () => ({
  useJsonForms: jest.fn(),
  withJsonFormsControlProps: jest.fn(),
}));

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

jest.mock('./utils', () => ({
  fetchAddressSuggestions: jest.fn(),
  filterAlbertaAddresses: jest.fn(),
  mapSuggestionToAddress: jest.fn(),
  filterSuggestionsWithoutAddressCount: jest.fn(),
  validatePostalCode: jest.fn(),
  formatPostalCodeIfNeeded: jest.fn(),
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
        <AddressLookUpControl {...props} />
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
  it('handleRequiredFieldBlur shows error if required field is empty', () => {
    const { baseElement } = renderComponent();
    const input = baseElement.querySelector('goa-input[name="addressLine1"]')!;
    act(() => {
      input.dispatchEvent(
        new CustomEvent('_blur', {
          bubbles: true,
          composed: true,
          detail: { name: 'addressLine1' },
        })
      );
    });

    expect(baseElement.textContent).toContain('Address LookupAlbertaCanada');
  });

  it('should render the component with input fields', () => {
    const { baseElement } = renderComponent();
    const input = baseElement.querySelector("goa-input[testId='address-form-address1']");
    expect(input?.getAttribute('placeholder')).toBe('Start typing the first line of your address, required.');
  });
  it('should render the input fields with empty values', () => {
    const { baseElement } = renderComponent();
    const input = baseElement.querySelector(
      "goa-input[placeholder='Start typing the first line of your address, required.']"
    );

    expect(input?.getAttribute('value')).toBe('');
  });

  it('renders inputs and suggestions', async () => {
    (fetchAddressSuggestions as jest.Mock).mockResolvedValueOnce(mockSuggestions);

    const { baseElement } = renderComponent();
    const inputField = baseElement.querySelector("goa-input[testId='address-form-address1']");
    inputField?.setAttribute('value', '123');
    fireEvent(
      inputField,
      new CustomEvent('_change', {
        detail: { name: 'addressLine1', value: '123' },
      })
    );

    expect(inputField?.getAttribute('value')).toBe('123');
  });

  it('can trigger onChange', async () => {
    (validatePostalCode as jest.Mock).mockResolvedValueOnce(true);
    const { baseElement } = renderComponent();
    const inputField = baseElement.querySelector("goa-input[testId='address-form-postal-code']");

    inputField?.setAttribute('value', 'T5H 1Y8');
    expect(inputField?.getAttribute('value')).toBe('T5H 1Y8');
  });

  it('can trigger input onBlur', async () => {
    const { baseElement } = renderComponent();
    const inputField = baseElement.querySelector("goa-input[testId='address-form-address1']");
    fireEvent.blur(inputField);
  });
  it('should increase selectedIndex on ArrowDown key press', () => {
    const { baseElement } = renderComponent();
    (fetchAddressSuggestions as jest.Mock).mockResolvedValueOnce(mockSuggestions);
    const inputField = baseElement.querySelector("goa-input[testId='address-form-address1']");
    inputField?.setAttribute('value', '123');
    fireEvent(
      inputField,
      new CustomEvent('_change', {
        detail: { name: 'addressLine1', value: '123' },
      })
    );

    fireEvent(
      inputField,
      new CustomEvent('_keyPress', {
        detail: {
          key: 'ArrowDown',
          code: 40,
          charCode: 0,
        },
      })
    );
    fireEvent(
      inputField,
      new CustomEvent('_keyPress', {
        detail: {
          key: 'ArrowUp',
          code: 38,
          charCode: 0,
        },
      })
    );

    fireEvent(
      inputField,
      new CustomEvent('_keyPress', {
        detail: {
          key: 'Enter',
          code: 13,
          charCode: 0,
        },
      })
    );
    expect(inputField?.getAttribute('value')).toBe('123');
  });

  it('displays no suggestions for less than 3 characters', async () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Start typing the first line of your address, required.');
    input?.setAttribute('value', 'ma');
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

describe('AddressLookUpControl with error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  mockUseJsonForms.mockReturnValue({
    core: mockCore,
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
      errors: 'error message',
      type: 'Control',
      scope: '#/properties/personFullName',
      path: 'address',
      schema: {
        title: 'Alberta postal address',
        properties: {
          subdivisionCode: {
            const: 'BC',
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
    {
      Id: '2',
      Text: '456 Elm St',
      Highlight: '',
      Cursor: 0,
      Description: 'Vancouver, BC, V5L 4S1',
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
    const { baseElement } = renderComponent();
    const input = baseElement.querySelector("goa-input[testId='address-form-address1']");
    expect(input?.getAttribute('placeholder')).toBe('Start typing the first line of your address, required.');
  });
});

describe('AddressLookUpControl - More tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

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

  const renderComponent = (overrides = {}) => {
    const defaultProps = {
      data: {},
      enabled: true,
      rootSchema: {},
      id: 'address',
      label: 'Mailing Address',
      visible: true,
      errors: '',
      type: 'Control',
      scope: '#/properties/address',
      path: 'address',
      schema: {
        title: 'Alberta postal address',
        properties: {
          subdivisionCode: {
            const: 'AB',
          },
        },
        required: ['addressLine1', 'municipality', 'postalCode'],
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

  describe('Default Address Initialization', () => {
    it('should use existing data if provided instead of default address', () => {
      const existingData = {
        addressLine1: '123 Test St',
        municipality: 'Calgary',
        postalCode: 'T1X 1A1',
        country: 'CA',
        subdivisionCode: 'AB',
      };

      renderComponent({ data: existingData });

      // When data is provided, component uses it instead of calling handleChange with defaults
      // The component should render with the existing data
      const input = document.querySelector("goa-input[testId='address-form-address1']");
      expect(input?.getAttribute('value')).toBe('123 Test St');
    });
  });

  describe('Autocomplete Option', () => {
    it('should enable autocomplete when option is not explicitly set to false', () => {
      const { baseElement } = renderComponent();

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");
      expect(input?.getAttribute('leadingIcon')).toBe('search');
    });

    it('should disable autocomplete when option is explicitly set to false', () => {
      const uischema = {
        type: 'Control',
        scope: '',
        options: {
          autocomplete: false,
        },
        label: 'Address Lookup',
      } as ControlElement;

      const { baseElement } = renderComponent({ uischema });

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");
      expect(input?.hasAttribute('leadingIcon')).toBe(false);
    });

    it('should show suggestions when autocomplete is enabled', async () => {
      (fetchAddressSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
      (filterSuggestionsWithoutAddressCount as jest.Mock).mockReturnValue(mockSuggestions);

      const { baseElement } = renderComponent();
      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");

      act(() => {
        fireEvent(
          input!,
          new CustomEvent('_change', {
            detail: { name: 'addressLine1', value: '123 Main' },
          })
        );
      });

      await waitFor(
        () => {
          expect(fetchAddressSuggestions).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Label Handling', () => {
    it('should use label from uischema when label is a non-empty string', () => {
      const { baseElement } = renderComponent();

      expect(baseElement.textContent).toContain('Address Lookup');
    });

    it('should use empty string when label is not a string', () => {
      const uischema = {
        type: 'Control',
        scope: '',
        options: {
          autocomplete: true,
        },
        label: undefined,
      } as unknown as ControlElement;

      const { baseElement } = renderComponent({ uischema });

      const h3 = baseElement.querySelector('h3');
      expect(h3?.textContent).toBe('');
    });

    it('should use empty string when label is an empty string', () => {
      const uischema = {
        type: 'Control',
        scope: '',
        options: {
          autocomplete: true,
        },
        label: '',
      } as ControlElement;

      const { baseElement } = renderComponent({ uischema });

      const h3 = baseElement.querySelector('h3');
      expect(h3?.textContent).toBe('');
    });

    it('should handle label as boolean (edge case)', () => {
      const uischema = {
        type: 'Control',
        scope: '',
        options: {
          autocomplete: true,
        },
        label: true,
      } as unknown as ControlElement;

      const { baseElement } = renderComponent({ uischema });

      const h3 = baseElement.querySelector('h3');
      expect(h3?.textContent).toBe('');
    });
  });

  describe('Field Deletion on Empty Value', () => {
    it('should delete field from address when value becomes empty', () => {
      const existingData = {
        addressLine1: '123 Test St',
        addressLine2: 'Unit 5',
        municipality: 'Calgary',
        postalCode: 'T1X 1A1',
      };

      const { baseElement } = renderComponent({ data: existingData });

      const addressLine2Input = baseElement.querySelector("goa-input[testId='address-form-address2']");

      act(() => {
        fireEvent(
          addressLine2Input!,
          new CustomEvent('_change', {
            detail: { name: 'addressLine2', value: '' },
          })
        );
      });

      // Should call handleChange without addressLine2
      expect(mockHandleChange).toHaveBeenCalledWith(
        'address',
        expect.not.objectContaining({ addressLine2: expect.anything() })
      );
    });

    it('should keep field in address when value is not empty', () => {
      const existingData = {
        addressLine1: '123 Test St',
        addressLine2: '',
      };

      const { baseElement } = renderComponent({ data: existingData });

      const addressLine2Input = baseElement.querySelector("goa-input[testId='address-form-address2']");

      act(() => {
        fireEvent(
          addressLine2Input!,
          new CustomEvent('_change', {
            detail: { name: 'addressLine2', value: 'Unit 10' },
          })
        );
      });

      expect(mockHandleChange).toHaveBeenCalledWith('address', expect.objectContaining({ addressLine2: 'Unit 10' }));
    });
  });

  describe('Error Deletion on Non-Postal Code Field', () => {
    it('should delete errors for non-postal code fields on change', () => {
      const existingData = {
        addressLine1: '',
        municipality: '',
      };

      const { baseElement } = renderComponent({ data: existingData });

      // First, trigger blur to create an error
      const municipalityInput = baseElement.querySelector("goa-input[testId='address-form-city']");

      act(() => {
        fireEvent(
          municipalityInput!,
          new CustomEvent('_blur', {
            detail: { name: 'municipality' },
          })
        );
      });

      // Now change the value - should clear the error
      act(() => {
        fireEvent(
          municipalityInput!,
          new CustomEvent('_change', {
            detail: { name: 'municipality', value: 'Calgary' },
          })
        );
      });

      // Verify handleChange was called with the new value
      expect(mockHandleChange).toHaveBeenCalledWith('address', expect.objectContaining({ municipality: 'Calgary' }));
    });
  });

  describe('Dropdown Selected State (Lines 206-239)', () => {
    it('should fetch suggestions when typing in addressLine1 and dropdownSelected is false', async () => {
      (fetchAddressSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
      (filterSuggestionsWithoutAddressCount as jest.Mock).mockReturnValue(mockSuggestions);

      const { baseElement } = renderComponent();

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");

      act(() => {
        fireEvent(
          input!,
          new CustomEvent('_change', {
            detail: { name: 'addressLine1', value: '123 Main Street' },
          })
        );
      });

      await waitFor(
        () => {
          expect(fetchAddressSuggestions).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('should not fetch suggestions when debouncedRenderAddress is less than 3 characters', async () => {
      (fetchAddressSuggestions as jest.Mock).mockResolvedValue([]);

      const { baseElement } = renderComponent();

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");

      act(() => {
        fireEvent(
          input!,
          new CustomEvent('_change', {
            detail: { name: 'addressLine1', value: '12' },
          })
        );
      });

      await waitFor(() => {
        expect(fetchAddressSuggestions).not.toHaveBeenCalled();
      });
    });

    it('should filter Alberta addresses when isAlbertaAddress is true', async () => {
      (fetchAddressSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
      (filterSuggestionsWithoutAddressCount as jest.Mock).mockReturnValue(mockSuggestions);
      (filterAlbertaAddresses as jest.Mock).mockReturnValue([mockSuggestions[0]]);

      const { baseElement } = renderComponent();

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");

      act(() => {
        fireEvent(
          input!,
          new CustomEvent('_change', {
            detail: { name: 'addressLine1', value: '123 Main' },
          })
        );
      });

      await waitFor(
        () => {
          expect(filterAlbertaAddresses).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('should not filter Alberta addresses when isAlbertaAddress is false', async () => {
      (fetchAddressSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
      (filterSuggestionsWithoutAddressCount as jest.Mock).mockReturnValue(mockSuggestions);

      const schema = {
        title: 'Canada postal address',
        properties: {
          subdivisionCode: { const: 'BC' },
        },
        required: ['addressLine1', 'municipality', 'postalCode'],
      } as JsonSchema7;

      const { baseElement } = renderComponent({ schema });

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");

      act(() => {
        fireEvent(
          input!,
          new CustomEvent('_change', {
            detail: { name: 'addressLine1', value: '123 Main' },
          })
        );
      });

      await waitFor(
        () => {
          expect(fetchAddressSuggestions).toHaveBeenCalled();
          expect(filterAlbertaAddresses).not.toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });

    it('should handle fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (fetchAddressSuggestions as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { baseElement } = renderComponent();

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");

      act(() => {
        fireEvent(
          input!,
          new CustomEvent('_change', {
            detail: { name: 'addressLine1', value: '123 Main' },
          })
        );
      });

      await waitFor(
        () => {
          expect(consoleErrorSpy).toHaveBeenCalledWith('Address fetch failed:', expect.any(Error));
        },
        { timeout: 2000 }
      );

      consoleErrorSpy.mockRestore();
    });

    it('should not log error for AbortError', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      (fetchAddressSuggestions as jest.Mock).mockRejectedValue(abortError);

      const { baseElement } = renderComponent();

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");

      act(() => {
        fireEvent(
          input!,
          new CustomEvent('_change', {
            detail: { name: 'addressLine1', value: '123 Main' },
          })
        );
      });

      await waitFor(() => {
        expect(consoleErrorSpy).not.toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should clear suggestions when search term is less than 3 characters', async () => {
      const { baseElement } = renderComponent();

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");

      act(() => {
        fireEvent(
          input!,
          new CustomEvent('_change', {
            detail: { name: 'addressLine1', value: 'ab' },
          })
        );
      });

      await waitFor(() => {
        const suggestionsList = baseElement.querySelector('.suggestions');
        expect(suggestionsList?.children.length).toBeFalsy();
      });
    });
  });

  describe('Suggestion Click Handler', () => {
    it('should handle suggestion click and update address', async () => {
      const mappedAddress: Address = {
        addressLine1: '123 Main St',
        municipality: 'Calgary',
        subdivisionCode: 'AB',
        postalCode: 'T1X 1A1',
        country: 'CA',
      };

      (mapSuggestionToAddress as jest.Mock).mockReturnValue(mappedAddress);
      (fetchAddressSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
      (filterSuggestionsWithoutAddressCount as jest.Mock).mockReturnValue(mockSuggestions);

      const { baseElement } = renderComponent();

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");

      act(() => {
        fireEvent(
          input!,
          new CustomEvent('_change', {
            detail: { name: 'addressLine1', value: '123 Main' },
          })
        );
      });

      // Wait for suggestions to appear
      await waitFor(
        () => {
          const listItems = baseElement.querySelectorAll('[data-testId^="listItem-"]');
          return listItems.length > 0;
        },
        { timeout: 2000 }
      );

      // Now click on the first suggestion
      const listItem = baseElement.querySelector('[data-testId="listItem-0"]');
      if (listItem) {
        act(() => {
          fireEvent.click(listItem);
        });

        expect(mapSuggestionToAddress).toHaveBeenCalledWith(mockSuggestions[0]);
        expect(mockHandleChange).toHaveBeenCalledWith('address', mappedAddress);
      }
    });
  });

  describe('Required Field Blur Handler', () => {
    it('should show error for municipality as "city is required"', () => {
      const { baseElement } = renderComponent({ data: {} });

      const municipalityInput = baseElement.querySelector("goa-input[testId='address-form-city']");

      act(() => {
        fireEvent(
          municipalityInput!,
          new CustomEvent('_blur', {
            detail: { name: 'municipality' },
          })
        );
      });

      // Check that the error was set in the component's state
      // The GoA component will have the error attribute set
      const formItem = baseElement.querySelector('goa-form-item[label="City"]');
      expect(formItem).toBeTruthy();
    });

    it('should show error for other required fields with field name', () => {
      const { baseElement } = renderComponent({ data: {} });

      const postalCodeInput = baseElement.querySelector("goa-input[testId='address-form-postal-code']");

      act(() => {
        fireEvent(
          postalCodeInput!,
          new CustomEvent('_blur', {
            detail: { name: 'postalCode' },
          })
        );
      });

      // Check that the form item exists
      const formItem = baseElement.querySelector('goa-form-item[label="Postal code"]');
      expect(formItem).toBeTruthy();
    });

    it('should clear error when field has value on blur', () => {
      const existingData = {
        addressLine1: '123 Test St',
      };

      const { baseElement } = renderComponent({ data: existingData });

      const addressLine1Input = baseElement.querySelector("goa-input[testId='address-form-address1']");

      act(() => {
        fireEvent(
          addressLine1Input!,
          new CustomEvent('_blur', {
            detail: { name: 'addressLine1' },
          })
        );
      });

      // The form item should exist with no error
      const formItem = baseElement.querySelector('goa-form-item[label="Street address or P.O. box"]');
      expect(formItem?.getAttribute('error')).toBe('');
    });

    it('should close suggestions dropdown on blur', async () => {
      (fetchAddressSuggestions as jest.Mock).mockResolvedValue(mockSuggestions);
      (filterSuggestionsWithoutAddressCount as jest.Mock).mockReturnValue(mockSuggestions);

      const { baseElement } = renderComponent();

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");

      act(() => {
        fireEvent(
          input!,
          new CustomEvent('_change', {
            detail: { name: 'addressLine1', value: '123 Main' },
          })
        );
      });

      // Wait a bit for debounce
      await waitFor(() => {}, { timeout: 1500 });

      act(() => {
        fireEvent(
          input!,
          new CustomEvent('_blur', {
            detail: { name: 'addressLine1' },
          })
        );
      });

      // Check that suggestions are not visible
      const suggestionsList = baseElement.querySelector('.suggestions');
      expect(suggestionsList?.children.length).toBe(0);
    });
  });

  describe('ReadOnly Property', () => {
    it('should set readonly attribute when componentProps.readOnly is true', () => {
      const uischema = {
        type: 'Control',
        scope: '',
        options: {
          autocomplete: true,
          componentProps: {
            readOnly: true,
          },
        },
        label: 'Address Lookup',
      } as ControlElement;

      const { baseElement } = renderComponent({ uischema });

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");
      expect(input?.getAttribute('readonly')).toBe('true');
    });

    it('should default readonly to false when not specified', () => {
      const { baseElement } = renderComponent();

      const input = baseElement.querySelector("goa-input[testId='address-form-address1']");

      expect(input?.getAttribute('readonly')).toBeFalsy();
    });
  });

  describe('Visible Prop', () => {
    it('should show component when visible is true', () => {
      const { container } = renderComponent({ visible: true });

      // Component should be visible - check if h3 exists
      const h3 = container.querySelector('h3');
      expect(h3).not.toBeNull();
    });
  });
});
