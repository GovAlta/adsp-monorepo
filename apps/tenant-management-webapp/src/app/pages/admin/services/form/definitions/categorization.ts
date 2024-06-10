export const schema = {
  type: 'object',
  properties: {
    link: {},
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
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/vegetarianOptions/properties/favoriteVegetable',
            },
            {
              type: 'Control',
              scope: '#/properties/vegetarianOptions/properties/vegan',
            },
          ],
        },
        {
          type: 'HelpContent',
          label:
            'This is a fillable application that can be completed online, printed, signed and sent to the AFFB Program',
          options: {
            help: 'Alberta Farm fuel benefit form',
            link: 'https://open.alberta.ca/dataset/70c50877-aaa9-442c-a10e-328eb53aa5f1/resource/2bfb6ff5-d246-4b76-8267-548ed58bf339/download/agi-alberta-farm-fuel-benefit-program-fuel-tax-exemption-application-2023.pdf',
            variant: 'hyperlink',
          },
        },
      ],
    },
  ],
};

export const data = {
  provideAddress: true,
  vegetarian: false,
};
