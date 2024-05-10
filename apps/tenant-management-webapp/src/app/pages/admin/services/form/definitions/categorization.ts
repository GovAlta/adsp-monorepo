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
                register: {
                  url: 'https://parallelum.com.br/fipe/api/v1/carros/marcas',
                  objectPathInArray: 'nome',
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
