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
      minLength: 10,
      maxLength: 10,
      pattern: '^[0-9]*$',
      description: 'Please enter a 10-digit phone number.',
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 100,
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      description: 'Please enter a valid email address (e.g., name@example.com).',
      errorMessage: {
        pattern: '(e.g., name@example.com).',
        maxLength: 'Email must be less than 100 characters.',
      },
    },
    comments: {
      type: 'string',
      description: 'Please provide any additional comments or information you would like to share.',
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
      label: 'Representative form',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: [
                  '#### Need help understanding how forms work?',
                  'Visit our [Form Service Guide](https://govalta.github.io/adsp-monorepo/tutorials/form-service/form-service.html) to learn more about configuring data schemas, UI layouts, validation rules, and more.',
                ],
              },
            },
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
                  scope: '#/properties/comments',
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
    },
    {
      type: 'Category',
      label: 'Address Information',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/mailingAddress',
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
