// clean-code-ignore: RULE-19 — a verbatim copy, exercised through the page it feeds. Asserting its
// contents here would only restate the copy.
// Copied from libs/condo-tribunal-common/src/schemas/versions/v1/applicationDataSchema.ts in
// GovAlta-EMU/adsp-applications. Kept verbatim so the sandbox reproduces the real CDRT form rather
// than a simplified stand-in; see ./locations.ts for the one part that had to be recreated.
import { countries, provinceStates, mailingCountries, mailingProvinceStates } from './locations';
import { JsonSchema7 } from '@jsonforms/core';

export const dataSchema: JsonSchema7 = {
  type: 'object',
  properties: {
    whichOfThemApplies: {
      type: 'array',
      default: [],
      items: {
        type: 'string',
        oneOf: [
          {
            const: 'Monetary sanctions imposed by a corporation, including the process in applying that sanction',
            title: 'Monetary sanctions imposed by a corporation, including the process in applying that sanction',
            description: 'For example: Receiving a monetary sanction for not following a rule in the bylaws',
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
        uniqueItems: true,
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
    whichOfThemAppliesOther: {
      type: 'string',
      title: 'Describe your dispute in a few words',
    },
    readyToApply: {
      type: 'object',
      properties: {
        hasDisputeTakenCareOff: {
          type: 'string',
          title: 'Has this dispute already been taken to court?',
          enum: [
            'No, there are no other applications',
            'Yes, I have filed an application with the courts',
            'Yes, I have been served with an application from the courts',
            "I'm not sure",
          ],
        },
      },
    },
    representativeContactInformation: {
      type: 'object',
      properties: {
        primaryFirstName: {
          type: 'string',
        },
        primaryLastName: {
          type: 'string',
        },
        primaryOrganizationBusinessName: {
          type: 'string',
        },
        primaryTitle: {
          type: 'string',
        },
        primaryEmail: {
          type: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          errorMessage: {
            pattern: 'Email is in a incorrect format',
          },
        },
        primaryPhone: {
          type: 'string',
          pattern: '^[+\\-0-9]+$',
          errorMessage: {
            pattern: 'Telephone can only contain digits, hyphens and/or plus symbol',
          },
        },
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
              },
              alternateLastName: {
                type: 'string',
              },
              alternateOrganizationBusinessName: {
                type: 'string',
              },
              alternateTitle: {
                type: 'string',
              },
              alternateEmail: {
                type: 'string',
                pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                errorMessage: {
                  pattern: 'Email is in a incorrect format',
                },
              },
              alternateTelephone: {
                type: 'string',
                pattern: '^[+\\-0-9]+$',
                errorMessage: {
                  pattern: 'Telephone can only contain digits, hyphens and/or plus symbol',
                },
              },
              makePrimaryContact: {
                type: 'boolean',
                allOf: [
                  {
                    enum: [true],
                  },
                ],
              },
            },
            required: [
              'alternateFirstName',
              'alternateLastName',
              'alternateOrganizationBusinessName',
              'alternateTitle',
              'alternateTelephone',
              'alternateEmail',
            ],
          },
        },
      },
      required: ['primaryFirstName', 'primaryLastName', 'primaryEmail', 'primaryPhone'],
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
          enum: provinceStates,
        },
        country: {
          type: 'string',
          enum: countries,
        },
        postalCodeZip: {
          type: 'string',
        },
      },
      required: ['addressLine1', 'city', 'provinceState', 'country', 'postalCodeZip'],
    },
    primaryDetailMailingAddress: {
      type: 'object',
      properties: {
        primaryMailingAddressLine1: {
          type: 'string',
        },
        primaryMailingAddressLine2: {
          type: 'string',
        },
        primaryMailingCityTown: {
          type: 'string',
        },
        primaryMailingProvinceState: {
          type: 'string',
          enum: mailingProvinceStates,
        },
        primaryMailingCountry: {
          type: 'string',
        },
        primaryMailingPostalCodeZip: {
          type: 'string',
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
        },
        middleName: {
          type: 'string',
        },
        lastName: {
          type: 'string',
        },
        condoCorporationName: { type: 'string' },
        email: {
          type: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          errorMessage: {
            pattern: 'Email is in a incorrect format',
          },
        },
        telephone: {
          type: 'string',
          pattern: '^[+\\-0-9]+$',
          errorMessage: {
            pattern: 'Telephone can only contain digits, hyphens and/or plus symbol',
          },
        },
        additionalApplicants: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              alternateFirstName: {
                type: 'string',
              },
              alternateLastName: {
                type: 'string',
              },
              alternateOrganizationBusinessName: {
                type: 'string',
              },
              alternateEmail: {
                type: 'string',
                pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                errorMessage: {
                  pattern: 'Email is in a incorrect format',
                },
              },
              alternateTelephone: {
                type: 'string',
                pattern: '^[+\\-0-9]+$',
                errorMessage: {
                  pattern: 'Telephone can only contain digits, hyphens and/or plus symbol',
                },
              },
              confirmPrimaryContact: {
                type: 'boolean',
                allOf: [
                  {
                    enum: [true],
                  },
                ],
              },
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
            required: ['addressLine1', 'city', 'provinceState', 'country', 'postalCodeZip'],
          },
        },
        fillingMailingAddress: {
          type: 'boolean',
          allOf: [
            {
              enum: [true],
            },
          ],
        },
        applicantPhysicalAddress: {
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
              enum: provinceStates,
            },

            country: {
              type: 'string',
              enum: countries,
            },
            postalCodeZip: {
              type: 'string',
            },
          },
          required: ['addressLine1', 'city', 'provinceState', 'country', 'postalCodeZip'],
        },
      },
      required: ['firstName', 'lastName', 'email', 'telephone'],
    },
    otherPartyDisputeDetails: {
      type: 'object',
      properties: {
        otherPartyPrimaryFirstName: {
          type: 'string',
        },
        otherPartyPrimaryLastName: {
          type: 'string',
        },
        otherPartyPrimaryCondoCorporationName: {
          type: 'string',
        },
        otherPartyPrimaryEmail: {
          type: 'string',
        },
        otherPartyPrimaryTelephone: {
          type: 'string',
          pattern: '^[+\\-0-9]+$',
          errorMessage: {
            pattern: 'Telephone can only contain digits, hyphens and/or plus symbol',
          },
        },

        additionalRespondents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              respondentFirstName: {
                type: 'string',
              },
              respondentLastName: {
                type: 'string',
              },
              respondentCondoCorpName: {
                type: 'string',
              },
              respondentEmail: {
                type: 'string',
                pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                errorMessage: {
                  pattern: 'Email is in a incorrect format',
                },
              },
              respondentTelephone: {
                type: 'string',
                pattern: '^[+\\-0-9]+$',
                errorMessage: {
                  pattern: 'Telephone can only contain digits, hyphens and/or plus symbol',
                },
              },
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
      required: [],
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
        },
        resultOfApplication: {
          type: 'string',
        },
      },
      required: ['disputeDescription', 'resultOfApplication'],
    },
    addSupportingDocuments: {
      type: 'string',
      enum: ['Yes, I would like to add optional supporting documents', 'No, not right now'],
    },
  },
  allOf: [
    {
      if: {
        properties: {
          fillingApplicationOnbehalf: {
            enum: ['Yes - lawyer', 'Yes - I have a personal representative'],
          },
        },
        required: ['fillingApplicationOnbehalf'],
      },
      then: {
        required: ['representativeContactInformation', 'representatitiveMailAddress'],
      },
    },
  ],
  required: [
    'whichOfThemApplies',
    'whenDidIssueHappen',
    'describeDispute',
    'disputeAlreadyTakenToCourt',
    'fillingApplicationOnbehalf',
    'addSupportingDocuments',
  ],
};
