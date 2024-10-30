import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { AddressLookUpControlReview } from './AddressLookUpControlReview';
import { JsonFormContext } from '../../Context';
import { ControlElement, ControlProps } from '@jsonforms/core';
import { JsonSchema7, JsonSchema4 } from '@jsonforms/core';

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
describe('AddressLookUpControlReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (overrides = {}) => {
    const defaultProps = {
      data: {
        addressLine1: '10111 111 ave',
        addressLine2: 'Second unit',
        city: 'Edmonton',
        province: 'AB',
        postalCode: 'T6G 1E1',
        country: 'CAN',
      },
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
        required: ['addressLine1', 'city', 'province', 'postalCode', 'country'], // Ensure required is at the root level
      } as unknown as ControlElement,
      scope: '#/properties/lastName',
      uischema: {
        options: {
          autocomplete: true,
        },
        label: 'Address Lookup',
        type: 'Control',
        scope: '#/properties/lastName',
      } as ControlElement,
      handleChange: mockHandleChange,
    };

    const props = { ...defaultProps, ...overrides };

    // eslint-disable-next-line
    return render(
      <JsonFormContext.Provider value={mockFormContext}>
        <AddressLookUpControlReview
          label={''}
          errors={''}
          rootSchema={{}}
          id={''}
          enabled={false}
          visible={false}
          {...props}
        />
      </JsonFormContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should render the component with input fields', () => {
    renderComponent();

    expect(screen.getByText('Alberta')).toBeInTheDocument();
    expect(screen.getByText('Canada')).toBeInTheDocument();
    expect(screen.getByText('Edmonton')).toBeInTheDocument();
    expect(screen.getByText('10111 111 ave')).toBeInTheDocument();
    expect(screen.getByText('T6G 1E1')).toBeInTheDocument();
  });
  it('should render the component with input fields with a different province ', () => {
    renderComponent({
      data: {
        province: 'BC',
        addressLine1: '10111 111 ave',
        addressLine2: 'Second unit',
        city: 'Edmonton',
        postalCode: 'T6G 1E1',
        country: 'CAN',
      },
      schema: {
        properties: {
          subdivisionCode: null,
        },
      },
    });

    expect(screen.getByText('British Columbia')).toBeInTheDocument();
    expect(screen.getByText('Canada')).toBeInTheDocument();
    expect(screen.getByText('Edmonton')).toBeInTheDocument();
    expect(screen.getByText('10111 111 ave')).toBeInTheDocument();
    expect(screen.getByText('T6G 1E1')).toBeInTheDocument();
  });
});
