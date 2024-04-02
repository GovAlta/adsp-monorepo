jest.mock('ajv', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    compile: jest.fn((schema) => {
      return jest.fn((data) => {
        return true;
      });
    }),
    validate: jest.fn(),
    addSchema: jest.fn(),
    addFormat: jest.fn(),
  })),
  compile: jest.fn((schema) => {
    return jest.fn((data) => {
      return true;
    });
  }),
  validate: jest.fn(), // Mock the validate method for non-default export
  addSchema: jest.fn(), // Mock any other methods you may need for non-default export
  addFormat: jest.fn(), // Mock any other methods you may need for non-default export
}));
import React, { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import '@testing-library/jest-dom';
import FormStepper from './FormStepperControl';

jest.mock('@jsonforms/core', () => ({
  ...jest.requireActual('@jsonforms/core'),
  isVisible: jest.fn(() => true), // Mocking isVisible to always return true
  isEnabled: jest.fn(() => true), // Mocking isVisible to always return true
}));
import { StatePropsOfLayout } from '@jsonforms/core';

import Ajv from 'ajv';
const ajvInstance = new Ajv({ allErrors: true, verbose: true });
import { Translator } from '@jsonforms/core';
import { ContextProvider } from '@abgov/jsonforms-components';
import { AjvProps } from '@jsonforms/material-renderers';
import { TranslateProps } from '@jsonforms/react';

export interface CategorizationStepperLayoutRendererProps extends StatePropsOfLayout, AjvProps, TranslateProps {
  // eslint-disable-next-line
  data: any;
}

const data = {
  firstName: 'Alex',
  address: {
    street: 'Springfield',
  },
};
const data1 = {
  firstName: '',
  address: {
    street: '',
  },
};

const translator: Translator = (id: string, defaultMessage: string | undefined, values?: any) => {
  return 'Translated text';
};

const schema = {
  type: 'object',
  properties: {
    firstName: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your first name',
    },
    secondName: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your second name',
    },
    vegetarian: {
      type: 'boolean',
    },
    birthDate: {
      type: 'string',
      format: 'date',
      description: 'Please enter your birth date.',
    },
    nationality: {
      type: 'string',
      enum: ['DE', 'IT', 'JP', 'US', 'RU', 'Other'],
    },
    provideAddress: {
      type: 'boolean',
    },
    address: {
      type: 'object',
      properties: {
        street: {
          type: 'string',
        },
        streetNumber: {
          type: 'string',
        },
        city: {
          type: 'string',
        },
        postalCode: {
          type: 'string',
          maxLength: 5,
        },
      },
    },
    vegetarianOptions: {
      type: 'object',
      properties: {
        vegan: {
          type: 'boolean',
        },
        favoriteVegetable: {
          type: 'string',
          enum: ['Tomato', 'Potato', 'Salad', 'Aubergine', 'Cucumber', 'Other'],
        },
        otherFavoriteVegetable: {
          type: 'string',
        },
      },
    },
    FileUploader: {
      description: 'file uploader !!!',
      format: 'file-urn',
      type: 'string',
    },
    FileUploader2: {
      description: 'file uploader !!!',
      format: 'file-urn',
      type: 'string',
    },
    carBrands: {
      type: 'string',
      enum: [''],
    },
    countries: {
      type: 'string',
      enum: [''],
    },
    dogBreeds: {
      type: 'string',
      enum: [''],
    },
    basketballPlayers: {
      type: 'string',
      enum: [''],
    },
  },
};

const uiSchema = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Personal Information',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/firstName',
            },
            {
              type: 'Control',
              scope: '#/properties/secondName',
            },
            {
              type: 'Control',
              scope: '#/properties/FileUploader',
              options: {
                variant: 'button',
              },
            },
            {
              type: 'Control',
              scope: '#/properties/FileUploader2',
              options: {
                variant: 'dragdrop',
              },
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/birthDate',
            },
            {
              type: 'Control',
              scope: '#/properties/nationality',
            },
            {
              type: 'Control',
              scope: '#/properties/carBrands',
              options: {
                enumContext: {
                  key: 'car-brands',
                  url: 'https://parallelum.com.br/fipe/api/v1/carros/marcas',
                  values: 'nome',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/dogBreeds',
              options: {
                enumContext: {
                  key: 'dog-list',
                  url: 'https://dog.ceo/api/breeds/list/all',
                  location: 'message',
                  type: 'keys',
                },
              },
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/basketballPlayers',
              options: {
                autocomplete: true,
                enumContext: {
                  key: 'basketball-players',
                  location: 'data',
                  url: 'https://www.balldontlie.io/api/v1/players',
                  values: ['first_name', 'last_name'],
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/countries',
              options: {
                autocomplete: true,
                enumContext: {
                  key: 'countries',
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      i18n: 'address',
      label: 'Address Information',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/address/properties/street',
            },
            {
              type: 'Control',
              scope: '#/properties/address/properties/streetNumber',
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/address/properties/city',
            },
            {
              type: 'Control',
              scope: '#/properties/address/properties/postalCode',
            },
          ],
        },
      ],
      rule: {
        effect: 'SHOW',
        condition: {
          scope: '#/properties/provideAddress',
          schema: { const: true },
        },
      },
    },
    {
      type: 'Category',
      label: 'Additional Information',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/vegetarianOptions/properties/vegan',
        },
        {
          type: 'Control',
          scope: '#/properties/vegetarianOptions/properties/favoriteVegetable',
        },
      ],
    },
  ],
};

const data2 = {
  provideAddress: true,
  vegetarian: false,
};

const staticProps: CategorizationStepperLayoutRendererProps = {
  uischema: uiSchema,
  schema: schema,
  enabled: true,
  label: 'Date control test',
  config: {},
  path: '',
  data: data2,
  visible: true,
  ajv: ajvInstance,
  locale: '',
  t: translator,
  direction: 'column',
};

describe('form stepper control', () => {
  const mockJsonFormContextValue = {
    data: new Map(),
    functions: new Map(),
    submitFunction: new Map([['submit-form', jest.fn()]]),
  };

  jest.mock('../../Context', () => ({
    ...jest.requireActual('../../Context'),
    JsonFormContext: {
      Consumer: ({ children }: { children: (value: any) => React.ReactNode }) => children(mockJsonFormContextValue),
    },
  }));

  const CustomWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    return <ContextProvider> {children}</ContextProvider>;
  };
  it('can render form stepper control', () => {
    const props = staticProps;
    const component = render(<FormStepper {...props} />, { wrapper: CustomWrapper });
    expect(component.getByTestId('form-stepper-test-wrapper')).toBeInTheDocument();
  });
});
