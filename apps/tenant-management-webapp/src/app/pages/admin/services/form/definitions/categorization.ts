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
    age: {
      type: 'number',
      multipleOf: 1,
      minimum: 0,
      description: '',
    },
    gender: {
      type: 'string',
      enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
      description: 'Select your gender',
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
    attestationConfirmationRadio: {
      type: 'string',
      enum: ['Yes', 'No'],
      description: 'Do you confirm and accept the declaration?',
    },
    isAttestationAccepted: {
      type: 'boolean',
      description: 'Please indicate your agreement with the terms and conditions.',
    },
  },
  required: [
    'fullName',
    'birthDate',
    'mailingAddress',
    'phoneNumber',
    'email',
    'isAttestationAccepted',
    'attestationConfirmationRadio',
  ],
};
export const uischema = {
  type: 'Categorization',
  elements: [
    {
      type: 'Category',
      label: 'Personal Information',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              label: 'Need help understanding how forms work?',
              elements: [
                {
                  type: 'HelpContent',
                  options: {
                    markdown: true,
                    help: [
                      '- Configuring data schemas',
                      '- Designing UI layouts',
                      '- Setting validation rules',
                      '- Managing conditional logic in forms',
                      '- Click below to learn how to design and configure dynamic forms using the <a href="https://govalta.github.io/adsp-monorepo/tutorials/form-service/form-service.html" target="_blank" rel="noopener noreferrer">Form Service Guide</a>.',
                    ],
                  },
                },
              ],
              options: {
                variant: 'details',
                help: '',
              },
            },
            {
              type: 'HorizontalLayout',
              elements: [
                {
                  type: 'Control',
                  scope: '#/properties/fullName',
                },
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
                  scope: '#/properties/gender',
                  label: 'Gender',
                },
                {
                  type: 'Control',
                  scope: '#/properties/age',
                  label: 'Age',
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
              type: 'Control',
              scope: '#/properties/attestationConfirmationRadio',
              label: 'I confirm and accept the declaration',
              options: {
                format: 'radio',
              },
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
