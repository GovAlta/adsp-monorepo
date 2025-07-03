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
    supportingDocuments: {
      type: 'string',
      format: 'file-urn',
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
      anyOf: [
        {
          enum: [true],
        },
      ],
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
      options: {
        sectionTitle: 'User Profile',
      },
      title: 'User Profile',
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
              type: 'Control',
              scope: '#/properties/isAttestationAccepted',
              label: '',
              options: {
                text: 'Is attestation accepted',
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      label: 'Address Information',
      options: {
        sectionTitle: 'Location',
      },
      title: 'Location',
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
    {
      type: 'Category',
      label: 'Upload Information',
      options: {
        sectionTitle: 'Application data',
      },
      elements: [
        {
          type: 'HelpContent',
          label: 'Supporting Documentation',
          options: {
            markdown: true,
            help: [
              'If applicable, attach images, videos, or documents to support your complaint.',
              'We accept: PDF, Word, JPEG, MP4, MP3, CSV.',
            ],
          },
        },
        {
          type: 'Control',
          scope: '#/properties/supportingDocuments',
          label: '',
          options: {
            variant: 'dragdrop',
          },
        },
      ],
    },
  ],
  options: {
    variant: 'stepper',
    showNavButtons: true,
    title: 'Default form Template',
    subtitle: 'Essential input Types',
  },
};

export const data = {
  provideAddress: true,
  vegetarian: false,
};
