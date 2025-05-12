export const schema = {
  type: 'object',
  properties: {
    link: {},
    fullName: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your full name',
    },
    birthDate: {
      type: 'string',
      format: 'date',
      description: 'Please enter your birth date.',
    },
    mailingAddress: {
      type: 'object',
      $ref: 'https://adsp.alberta.ca/common.v1.schema.json#/definitions/postalAddressCanada',
    },
    phoneNumber: {
      type: 'string',
      maxLength: 10,
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
  required: ['fullName', 'birthDate', 'mailingAddress', 'phoneNumber', 'email', 'isAttestationAccepted'],
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
              scope: '#/properties/fullName',
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
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Group',
              label: 'Mailing address',
              elements: [
                {
                  type: 'Control',
                  scope: '#/properties/mailingAddress',
                },
              ],
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
