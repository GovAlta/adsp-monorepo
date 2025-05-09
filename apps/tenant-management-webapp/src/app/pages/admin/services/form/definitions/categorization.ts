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
    birthDate: {
      type: 'string',
      format: 'date',
      description: 'Please enter your birth date.',
    },
    mailingAddress: {
      type: 'object',
      properties: {
        street: {
          type: 'string',
          minLength: 5,
          description: 'Please enter your street address. This field is required.',
        },
        city: {
          type: 'string',
          minLength: 3,
          description: 'Please enter your city. This field is required.',
        },
        postalCode: {
          type: 'string',
          pattern: '^[0-9]{5}$',
          description: 'Please enter your 5-digit postal code.',
        },
      },
      required: ['street', 'city', 'postalCode'],
    },
    phoneNumber: {
      type: 'string',
      pattern: '^[0-9]{10}$',
      description: 'Please enter your phone number (10 digits).',
    },
    email: {
      type: 'string',
      format: 'email',
      description: 'Please enter your email address.',
    },
    isAttestationAccepted: {
      type: 'boolean',
      description: 'Please indicate your agreement with the terms and conditions.',
    },
  },
  required: ['firstName', 'secondName', 'birthDate', 'mailingAddress', 'phoneNumber', 'email', 'isAttestationAccepted'],
};

export const uischema = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: '',
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
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/birthDate',
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/mailingAddress/properties/street',
            },
            {
              type: 'Control',
              scope: '#/properties/mailingAddress/properties/city',
            },
            {
              type: 'Control',
              scope: '#/properties/mailingAddress/properties/postalCode',
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/phoneNumber',
            },
            {
              type: 'Control',
              scope: '#/properties/email',
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/isAttestationAccepted',
            },
          ],
        },
      ],
    },
  ],
};

export const data = {
  provideAddress: true,
  vegetarian: false,
};
