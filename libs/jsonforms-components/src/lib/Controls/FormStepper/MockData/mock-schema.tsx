import { JsonSchema4, JsonSchema7 } from '@jsonforms/core';

export const Schema: JsonSchema4 | JsonSchema7 = {
  type: 'object',
  properties: {
    firstName: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your first name',
    },
    multiLine: {
      type: 'string',
    },
    integer: {
      type: 'integer',
    },
    number: {
      type: 'number',
    },
    multiples: {
      type: 'number',
      multipleOf: 10,
      minimum: 10,
      exclusiveMaximum: 200,
    },
    secondName: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your second name',
    },
    vegetarian: {
      type: 'boolean',
    },
    testCategoryAddress: {
      type: 'boolean',
    },
    testVerticalLayout: {
      type: 'boolean',
    },
    testHorizontalLayout: {
      type: 'boolean',
    },
    testHelpContent: {
      type: 'boolean',
    },
    testGroup: {
      type: 'boolean',
    },
    testControl: {
      type: 'boolean',
    },
    testListWithDetail: {
      type: 'boolean',
    },
    testCategorization: {
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
    fileUploader: {
      description: 'file uploader !!!',
      format: 'uri',
      type: 'string',
    },
    fileUploader2: {
      description: 'file uploader !!!',
      format: 'uri',
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
    dependant: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          'first-name': {
            type: 'string',
            maxLength: 20,
          },
          'last-name': {
            type: 'string',
            maxLength: 20,
          },
          dob: {
            type: 'string',
            format: 'date',
          },
          address: {
            type: 'string',
            maxLength: 200,
          },
        },
        required: ['first-name', 'last-name'],
      },
    },
  },
  required: ['firstName'],
};
