export const schema = {
  type: 'object',
  properties: {
    link: {},
    firstName: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your first name',
      required: true,
    },
    secondName: {
      type: 'string',
      minLength: 3,
      description: 'Please enter your second name',
      required: true,
    },
    birthDate: {
      type: 'string',
      format: 'date',
      description: 'Please enter your birth date.',
      required: true,
    },
    nationality: {
      type: 'string',
      enum: ['DE', 'IT', 'JP', 'US', 'RU', 'Other'],
      description: 'Select your nationality.',
    },
    provideAddress: {
      type: 'boolean',
      description: 'Do you want to provide an address?',
    },
    address: {
      type: 'object',
      properties: {
        street: {
          type: 'string',
          required: true,
          description: 'Enter your street address.',
        },
        streetNumber: {
          type: 'string',
          description: 'Enter your street number.',
        },
        city: {
          type: 'string',
          required: true,
          description: 'Enter your city.',
        },
        postalCode: {
          type: 'string',
          maxLength: 5,
          pattern: '^[0-9]{5}$',
          description: 'Enter your postal code (5 digits).',
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
    developmentPrograms: {
      type: 'object',
      properties: {
        hydrogenDevelopment: {
          type: 'string',
          description: 'Describe your involvement in hydrogen technologies.',
        },
        geothermalResourceDevelopment: {
          type: 'string',
          description: 'Describe your involvement in geothermal resource development.',
        },
        naturalGasVision: {
          type: 'boolean',
          description: 'Do you support the plan for the natural gas sector?',
        },
        pipelineProjectKeystoneXL: {
          type: 'boolean',
          description: 'Do you have any association with the Keystone XL pipeline project?',
        },
        unconventionalResources: {
          type: 'boolean',
          description: 'Are you involved in the development of unconventional oil and natural gas resources?',
        },
      },
    },
    environmentalEducation: {
      type: 'object',
      properties: {
        aqhiResources: {
          type: 'boolean',
          description: 'Are you familiar with resources related to the Air Quality Health Index (AQHI)?',
        },
        bowHabitatStation: {
          type: 'boolean',
          description: 'Have you visited Bow Habitat Station to learn about Alberta’s flora, fauna, and fish?',
        },
        environmentalToolsGuide: {
          type: 'string',
          description: 'What environmental tools are you familiar with? (Tools used by government, industry, etc.)',
        },
        educationalResources: {
          type: 'boolean',
          description: 'Are you aware of the educational resources available for schools and communities?',
        },
        weatherAndClimateResources: {
          type: 'boolean',
          description:
            'Are you using resources from the Alberta Climate Information Service for weather and climate planning?',
        },
      },
    },
    drivingSafety: {
      type: 'object',
      properties: {
        commercialDriving: {
          type: 'boolean',
          description: 'Are you involved in commercial driving? (Safety, rules, and regulations)',
        },
        driversEducation: {
          type: 'boolean',
          description: 'Have you attended any driver’s education or training programs?',
        },
        electionSigns: {
          type: 'boolean',
          description: 'Are you aware of the rules for placing election signs on provincial highways?',
        },
        licensingVehicle: {
          type: 'boolean',
          description: 'Have you registered or inspected a vehicle in Alberta?',
        },
        trafficSafety: {
          type: 'boolean',
          description: 'Do you follow traffic safety guidelines and laws to improve road safety?',
        },
        vehicleOwnershipStatus: {
          type: 'string',
          enum: ['Own', 'Lease', 'None'],
          description: 'What is your current status regarding vehicle ownership?',
        },
        publicTransportUsage: {
          type: 'string',
          enum: ['Daily', 'Occasionally', 'Never'],
          description: 'How often do you use public transportation?',
        },
        vehicleInspectionRating: {
          type: 'number',
          description: 'On a scale from 1 to 10, how would you rate your last vehicle inspection?',
          minimum: 1,
          maximum: 10,
        },
      },
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
      label: 'Driving Safety and Education',
      elements: [
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/drivingSafety/commercialDriving',
            },
            {
              type: 'Control',
              scope: '#/properties/drivingSafety/driversEducation',
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/drivingSafety/electionSigns',
            },
            {
              type: 'Control',
              scope: '#/properties/drivingSafety/licensingVehicle',
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/drivingSafety/trafficSafety',
            },
            {
              type: 'Control',
              scope: '#/properties/drivingSafety/vehicleOwnershipStatus',
            },
          ],
        },
        {
          type: 'HorizontalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/drivingSafety/publicTransportUsage',
            },
            {
              type: 'Control',
              scope: '#/properties/drivingSafety/vehicleInspectionRating',
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
