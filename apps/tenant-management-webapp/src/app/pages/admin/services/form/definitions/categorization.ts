export const schema = {
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
    fileUploader: {
      description: 'file uploader !!!',
      format: 'file-urn',
      type: 'string',
    },
    fileUploader2: {
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

export const uischema = {
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
              scope: '#/properties/fileUploader',
              options: {
                variant: 'button',
              },
            },
            {
              type: 'Control',
              scope: '#/properties/fileUploader2',
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

export const data = {
  provideAddress: true,
  vegetarian: false,
};
