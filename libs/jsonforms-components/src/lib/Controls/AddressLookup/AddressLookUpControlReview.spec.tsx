import React, { Dispatch } from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { AddressLookUpControlReview, AddressLoopUpControlTableReview } from './AddressLookUpControlReview';
import { JsonFormContext } from '../../Context';
import { JsonFormsStepperContextProvider } from '../FormStepper/context';
import { CategorizationStepperLayoutRendererProps } from '../FormStepper/types';
import Ajv from 'ajv';
import { ControlElement } from '@jsonforms/core';

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

const defaultProps = {
  data: {
    addressLine1: '10111 111 ave',
    addressLine2: 'Second unit',
    municipality: 'Edmonton',
    subdivisionCode: 'AB',
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
    required: ['addressLine1', 'municipality', 'subdivisionCode', 'postalCode', 'country'], // Ensure required is at the root level
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
describe('AddressLookUpControlReview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (overrides = {}) => {
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
        subdivisionCode: 'BC',
        addressLine1: '10111 111 ave',
        addressLine2: 'Second unit',
        municipality: 'Vancouver',
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
    expect(screen.getByText('Vancouver')).toBeInTheDocument();
    expect(screen.getByText('10111 111 ave')).toBeInTheDocument();
    expect(screen.getByText('T6G 1E1')).toBeInTheDocument();
  });
});

describe('AddressLoopUpControlTableReview', () => {
  const mockDispatch = jest.fn();

  // eslint-disable-next-line
  type TestProps = CategorizationStepperLayoutRendererProps & { customDispatch: Dispatch<any> } & { activeId: number };
  const categorization = {
    type: 'Categorization',
    label: 'Test Categorization',
    elements: [],
    options: {
      variant: 'stepper',
      testId: 'stepper-test',
      showNavButtons: true,
      nextButtonLabel: 'testNext',
      nextButtonType: 'primary',
      previousButtonLabel: 'testPrevious',
      previousButtonType: 'primary',
      componentProps: { controlledNav: true },
    },
  };
  const stepperBaseProps: TestProps = {
    uischema: categorization,
    schema: {},
    enabled: true,
    direction: 'column',
    visible: true,
    path: 'test-path',
    ajv: new Ajv({ allErrors: true, verbose: true }),
    t: jest.fn(),
    locale: 'en',
    activeId: 0,
    customDispatch: mockDispatch,
  };

  const { customDispatch, ...stepperBasePropsNoDispatch } = stepperBaseProps;
  const renderComponent = (overrides = {}) => {
    const props = { ...defaultProps, ...overrides };

    // eslint-disable-next-line
    return render(
      <JsonFormsStepperContextProvider
        StepperProps={stepperBaseProps}
        children={
          <JsonFormContext.Provider value={mockFormContext}>
            <AddressLoopUpControlTableReview
              label={''}
              errors={''}
              rootSchema={{}}
              id={''}
              enabled={false}
              visible={false}
              {...props}
            />
          </JsonFormContext.Provider>
        }
      />
    );
  };
  it('should render the component with input fields', async () => {
    const { baseElement } = renderComponent();
    expect(screen.getByText('Alberta postal address')).toBeInTheDocument();
    expect(screen.getByText('CAN')).toBeInTheDocument();
    expect(screen.getByText('Edmonton')).toBeInTheDocument();
    expect(screen.getByText('10111 111 ave')).toBeInTheDocument();
    expect(screen.getByText('T6G 1E1')).toBeInTheDocument();
  });
});
