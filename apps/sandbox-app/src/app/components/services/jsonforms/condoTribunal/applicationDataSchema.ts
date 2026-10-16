import { countries, provinceStates, mailingCountries, mailingProvinceStates } from './locations';
import { JsonSchema7 } from '@jsonforms/core';

const emailProperty: JsonSchema7 = {
  type: 'string',
  pattern: '^(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})?$',
  errorMessage: {
    pattern: 'Email is in an incorrect format',
  },
};

const telephoneProperty: JsonSchema7 = {
  type: 'string',
  pattern: '^(?:[+\\-0-9]+)?$',
  errorMessage: {
    pattern: 'Telephone can only contain digits, hyphens and/or plus symbol',
  },
};

export const dataSchema: JsonSchema7 = {
  type: 'object',
  properties: {
    whichOfThemApplies: {
      type: 'array',
      default: [],
      uniqueItems: true,
      items: {
        type: 'string',
        oneOf: [
          {
            const: 'Monetary sanctions imposed by a corporation, including the process in applying that sanction',
            title: 'Monetary sanctions imposed by a corporation, including the process in applying that sanction',
            description: 'For example: Receiving a fine for not following a rule in the bylaws',
          },
          {
            const: 'Access to condominium documents',
            title: 'Access to condominium documents',
            description: 'For example: Getting access to the approved minutes of the AGM or the annual budget',
          },
          {
            const: 'General meetings and special general meetings of a corporation or its board',
            title: 'General meetings and special general meetings of a corporation or its board',
            description: 'For example: The AGM was not held within 15 months of the previous AGM',
          },
        ],
      },
      minItems: 1,
      errorMessage: {
        minItems: 'Choose all that apply is required',
      },
    },
    disputeAlreadyTakenToCourt: {
      type: 'string',
      enum: [
        'No, there are no other applications',
        'Yes, I have filed an application with the courts',
        'Yes, I have been served with an application by the courts',
        "I'm not sure",
      ],
    },
    fillingApplicationOnbehalf: {
      type: 'string',
      enum: ['No', 'Yes - lawyer', 'Yes - I have a personal representative'],
    },
    representativeContactInformation: {
      type: 'object',
      properties: {
        primaryFirstName: {
          type: 'string',
          minLength: 1,
        },
        primaryLastName: {
          type: 'string',
          minLength: 1,
        },
        primaryOrganizationBusinessName: {
          type: 'string',
        },
        primaryTitle: {
          type: 'string',
        },
        primaryEmail: { ...emailProperty },
        primaryPhone: { ...telephoneProperty },
        alternateFirstName: {
          type: 'string',
        },
        alternateLastName: {
          type: 'string',
        },
        alternateOrganizationBusinessName: {
          type: 'string',
        },
        alternateContact: {
          type: 'array',
          items: {
            type: 'object',
            title: 'Contact',
            properties: {
              alternateFirstName: {
                type: 'string',
                minLength: 1,
              },
              alternateLastName: {
                type: 'string',
                minLength: 1,
              },
              alternateOrganizationBusinessName: {
                type: 'string',
              },
              alternateTitle: {
                type: 'string',
              },
              alternateEmail: { ...emailProperty },
              alternateTelephone: { ...telephoneProperty },
              makePrimaryContact: {
                type: 'boolean',
              },
            },
            required: ['alternateFirstName', 'alternateLastName', 'alternateTelephone', 'alternateEmail'],
          },
        },
      },
    },

    representatitiveMailAddress: {
      type: 'object',
      properties: {
        addressLine1: {
          type: 'string',
        },
        addressLine2: {
          type: 'string',
        },
        city: {
          type: 'string',
        },
        provinceState: {
          type: 'string',
          enum: mailingProvinceStates,
        },
        country: {
          type: 'string',
          enum: mailingCountries,
        },
        postalCodeZip: {
          type: 'string',
        },
      },
    },
    primaryDetailMailingAddress: {
      type: 'object',
      properties: {
        primaryMailingAddressLine1: {
          type: 'string',
          minLength: 1,
        },
        primaryMailingAddressLine2: {
          type: 'string',
        },
        primaryMailingCityTown: {
          type: 'string',
          minLength: 1,
        },
        primaryMailingProvinceState: {
          type: 'string',
          enum: mailingProvinceStates,
        },
        primaryMailingCountry: {
          type: 'string',
          enum: mailingCountries,
        },
        primaryMailingPostalCodeZip: {
          type: 'string',
          minLength: 1,
        },
      },
      required: [
        'primaryMailingAddressLine1',
        'primaryMailingCityTown',
        'primaryMailingProvinceState',
        'primaryMailingCountry',
        'primaryMailingPostalCodeZip',
      ],
    },

    applicantContactDetails: {
      type: 'object',
      properties: {
        firstName: {
          type: 'string',
          minLength: 1,
        },
        middleName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
          minLength: 1,
        },
        condoCorporationName: { type: 'string' },
        email: { ...emailProperty },
        telephone: { ...telephoneProperty },
        additionalApplicants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternateFirstName: {
                type: 'string',
                minLength: 1,
              },
              alternateLastName: {
                type: 'string',
                minLength: 1,
              },
              alternateOrganizationBusinessName: {
                type: 'string',
              },
              alternateEmail: { ...emailProperty },
              alternateTelephone: { ...telephoneProperty },
            },
            required: ['alternateFirstName', 'alternateLastName', 'alternateEmail', 'alternateTelephone'],
          },
        },
        additionalMailAddress: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              addressLine1: {
                type: 'string',
                minLength: 1,
              },
              addressLine2: {
                type: 'string',
              },
              city: {
                type: 'string',
                minLength: 1,
              },
              provinceState: {
                type: 'string',
                enum: mailingProvinceStates,
              },
              country: {
                type: 'string',
                enum: mailingCountries,
              },
              postalCodeZip: {
                type: 'string',
                minLength: 1,
              },
            },
            required: ['addressLine1', 'city', 'provinceState', 'country', 'postalCodeZip'],
          },
        },
        fillingMailingAddress: {
          type: 'boolean',
        },
        applicantPhysicalAddress: {
          type: 'object',
          properties: {
            addressLine1: {
              type: 'string',
              minLength: 1,
            },
            addressLine2: {
              type: 'string',
            },
            city: {
              type: 'string',
              minLength: 1,
            },
            provinceState: {
              type: 'string',
              enum: provinceStates,
            },

            country: {
              type: 'string',
              enum: countries,
            },
            postalCodeZip: {
              type: 'string',
              minLength: 6,
            },
          },
          required: ['addressLine1', 'city', 'provinceState', 'country', 'postalCodeZip'],
        },
      },
      required: ['firstName', 'lastName', 'email', 'telephone', 'applicantPhysicalAddress'],
    },
    otherPartyDisputeDetails: {
      type: 'object',
      properties: {
        otherPartyPrimaryFirstName: {
          type: 'string',
          minLength: 1,
        },
        otherPartyPrimaryLastName: {
          type: 'string',
        },
        otherPartyPrimaryCondoCorporationName: {
          type: 'string',
        },
        otherPartyPrimaryEmail: { ...emailProperty },
        otherPartyPrimaryTelephone: { ...telephoneProperty },

        additionalRespondents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              respondentFirstName: {
                type: 'string',
                minLength: 1,
              },
              respondentLastName: {
                type: 'string',
              },
              respondentCondoCorpName: {
                type: 'string',
              },
              respondentEmail: { ...emailProperty },
              respondentTelephone: { ...telephoneProperty },
            },
            required: ['respondentFirstName'],
          },
        },
      },
      required: ['otherPartyPrimaryFirstName'],
    },

    primaryRespondentMailAddress: {
      type: 'object',
      properties: {
        addressLine1: {
          type: 'string',
        },
        addressLine2: {
          type: 'string',
        },
        city: {
          type: 'string',
        },
        provinceState: {
          type: 'string',
          enum: mailingProvinceStates,
        },
        country: {
          type: 'string',
          enum: mailingCountries,
        },
        postalCodeZip: {
          type: 'string',
        },
      },
    },
    whenDidIssueHappen: {
      type: 'object',
      properties: {
        whenWasIssueDate: {
          type: 'string',
          format: 'date',
        },
      },
      required: ['whenWasIssueDate'],
    },
    isIssueStillHappening: {
      type: 'string',
      enum: ['Yes, it is still happening', 'No, it happened in the past'],
    },
    describeDispute: {
      type: 'object',
      properties: {
        disputeDescription: {
          type: 'string',
          minLength: 1,
          maxLength: 5000,
          errorMessage: {
            maxLength: 'Dispute description must be 5000 characters or less',
          },
        },
        resultOfApplication: {
          type: 'string',
          minLength: 1,
          maxLength: 2000,
          errorMessage: {
            maxLength: 'Desired outcome must be 2000 characters or less',
          },
        },
      },
      required: ['disputeDescription', 'resultOfApplication'],
    },
  },
  allOf: [
    {
      if: {
        type: 'object',
        properties: {
          fillingApplicationOnbehalf: {
            type: 'string',
            enum: ['Yes - lawyer', 'Yes - I have a personal representative'],
          },
        },
        required: ['fillingApplicationOnbehalf'],
      },
      then: {
        type: 'object',
        properties: {
          representativeContactInformation: {
            type: 'object',
            required: ['primaryFirstName', 'primaryLastName', 'primaryEmail', 'primaryPhone'],
          },
        },
        required: ['representativeContactInformation'],
      },
    },
  ],
  required: [
    'whichOfThemApplies',
    'whenDidIssueHappen',
    'describeDispute',
    'disputeAlreadyTakenToCourt',
    'fillingApplicationOnbehalf',
    'applicantContactDetails',
  ],
};
