// clean-code-ignore: RULE-19 — a verbatim copy, exercised through the page it feeds. Asserting its
// contents here would only restate the copy.
// Copied from libs/condo-tribunal-common/src/schemas/versions/v1/applicationUiSchema.ts in
// GovAlta-EMU/adsp-applications. Kept verbatim — the point of the sandbox page is to reproduce the
// real CDRT form's navigation behaviour, so nothing here is simplified or reordered.
export const uiSchema = {
  type: 'Categorization',
  options: {
    variant: 'pages',
    title: 'Step 1: Complete application form',
    subtitle: '',
    toAppOverviewLabel: 'Back to application overview',
    hideSubmit: true,
    hideSummary: false,
    hideProgress: true,
  },
  elements: [
    {
      type: 'Category',
      label: 'What is your dispute about?',
      options: {
        sectionTitle: 'Before you continue',
        showInTaskList: true,
      },
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: ['## What is your dispute about?', '<br/>'],
              },
            },
            {
              type: 'Control',
              scope: '#/properties/whichOfThemApplies',
              label: 'Choose all options that best apply',
              options: {
                format: 'checkbox',
                componentProps: {
                  orientation: 'vertical',
                },
              },
            },
            {
              type: 'Callout',
              options: {
                componentProps: {
                  type: 'important',
                  maxWidth: '800px',
                  heading: 'Not sure if your dispute is about a monetary sanction or a chargeback?',
                  message:
                    'The CDRT can hear disputes about monetary sanctions, but not about chargebacks. If your dispute is only about a chargeback, the CDRT may refuse your application. Monetary sanctions are enforcement tools, such as fines, used by condominium corporations for non-compliance with bylaws. Chargebacks are fees billed back to recover costs paid by a condominium corporation.',
                },
              },
              rule: {
                effect: 'SHOW',
                condition: {
                  scope: '#/properties/whichOfThemApplies',
                  schema: {
                    contains: {
                      const:
                        'Monetary sanctions imposed by a corporation, including the process in applying that sanction',
                    },
                  },
                  failWhenUndefined: true,
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      label: 'Has this dispute already been taken to court?',
      options: {
        sectionTitle: 'Before you continue',
        showInTaskList: true,
      },
      elements: [
        {
          type: 'HelpContent',
          options: {
            markdown: true,
            help: ['## Has this dispute already been taken to court?', '<br/>'],
          },
        },
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/disputeAlreadyTakenToCourt',
              label: 'Choose the option that best applies.',
              options: {
                format: 'radio',
              },
            },
            {
              type: 'Callout',
              options: {
                componentProps: {
                  type: 'important',
                  maxWidth: '700px',
                  emphasis: 'low',
                  message:
                    'If there is already an application with the court about this dispute, you should follow up on that one instead.',
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      options: {
        sectionTitle: 'The parties',
        showInTaskList: true,
      },
      label: 'Who is the person involved in the dispute?',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: [
                  '## Who is the person involved in the dispute?',
                  '<br/>',
                  '### Please enter the contact information of the applicant (owner or condominium corporation)',
                  '<br/>',
                ],
              },
            },
            {
              type: 'Control',
              scope: '#/properties/applicantContactDetails/properties/firstName',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/applicantContactDetails/properties/middleName',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/applicantContactDetails/properties/lastName',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/applicantContactDetails/properties/condoCorporationName',
              label: 'Corporation name, if applicable',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/applicantContactDetails/properties/email',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/applicantContactDetails/properties/telephone',
              options: {
                help: 'Enter a domestic or international phone number.',
                componentProps: {
                  type: 'tel',
                  width: '50ch',
                },
              },
            },
            {
              type: 'ListWithDetail',
              scope: '#/properties/applicantContactDetails/properties/additionalApplicants',
              options: {
                addButtonType: 'secondary',
                itemLabel: 'Applicant',
                noDataMessage: '',
                addButtonUIProps: {
                  leadingIcon: 'Add',
                },
                componentProps: {
                  withLeftTab: true,
                },
                detail: {
                  type: 'VerticalLayout',
                  elements: [
                    {
                      type: 'VerticalLayout',
                      elements: [
                        {
                          type: 'Control',
                          scope: '#/properties/alternateFirstName',
                          label: 'First name',
                          options: {
                            componentProps: {
                              width: '50ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/alternateLastName',
                          label: 'Last name',
                          options: {
                            componentProps: {
                              width: '50ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/alternateOrganizationBusinessName',
                          label: 'Organization or business name',
                          options: {
                            componentProps: {
                              width: '50ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/alternateEmail',
                          label: 'Email',
                          options: {
                            componentProps: {
                              width: '50ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/alternateTelephone',
                          label: 'Telephone',
                          options: {
                            componentProps: {
                              leadingContent: '1+',
                              width: '45ch',
                            },
                          },
                        },
                        {
                          type: 'Callout',
                          options: {
                            componentProps: {
                              type: 'important',
                              emphasis: 'low',
                              message:
                                'In a situation where a group of people are making an application, all individuals listed must agree on one person being the primary contact person. This person will be the primary contact for the application. You will be required to provide proof that your group has agreed with who the primary contact will be.',
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      label: 'What is the physical address of the condominium unit involved in the dispute?',
      options: {
        sectionTitle: 'The parties',
        showInTaskList: true,
      },
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: ['##  What is the physical address of the condominium unit involved in the dispute?', '<br/>'],
              },
            },
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: ['### Enter the address on the property title.', '<br/>'],
              },
            },
            {
              type: 'Control',
              scope: '#/properties/applicantContactDetails/properties/applicantPhysicalAddress/properties/addressLine1',
              label: 'Address line 1',
              options: {
                help: 'For example, house number and street name',
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/applicantContactDetails/properties/applicantPhysicalAddress/properties/addressLine2',
              label: 'Address line 2',
              options: {
                help: 'For example, apartment, suite, unit, building, floor, etc.',
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/applicantContactDetails/properties/applicantPhysicalAddress/properties/city',
              label: 'City',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope:
                '#/properties/applicantContactDetails/properties/applicantPhysicalAddress/properties/provinceState',
              label: 'Province',
              options: {
                componentProps: {
                  width: '53ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/applicantContactDetails/properties/applicantPhysicalAddress/properties/country',
              label: 'Country',
              options: {
                componentProps: {
                  width: '53ch',
                },
              },
            },
            {
              type: 'Control',
              scope:
                '#/properties/applicantContactDetails/properties/applicantPhysicalAddress/properties/postalCodeZip',
              label: 'Postal code',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: [
                  '<br/>',
                  '###  Mailing address of the person involved in the dispute (if different from physical address)',
                  'Where the applicant receives mail',
                  '<br/>',
                ],
              },
            },
            {
              type: 'ListWithDetail',
              label: 'Mailing address',
              scope: '#/properties/applicantContactDetails/properties/additionalMailAddress',
              options: {
                addButtonText: 'Add mailing address',
                addButtonType: 'secondary',
                itemLabel: 'Address',
                noDataMessage: '',
                addButtonUIProps: {
                  leadingIcon: 'Add',
                },
                componentProps: {
                  withLeftTab: true,
                },
                detail: {
                  type: 'VerticalLayout',
                  maxItems: 1,
                  elements: [
                    {
                      type: 'VerticalLayout',
                      elements: [
                        {
                          type: 'Control',
                          scope: '#/properties/addressLine1',
                          label: 'Address line 1',
                          options: {
                            help: 'For example, house number and street name',
                            componentProps: {
                              width: '50ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/addressLine2',
                          label: 'Address line 2',
                          options: {
                            help: 'For example, apartment, suite, unit, building, floor, etc.',
                            componentProps: {
                              width: '50ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/city',
                          label: 'City',
                          options: {
                            componentProps: {
                              width: '50ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/provinceState',
                          label: 'Province',
                          options: {
                            componentProps: {
                              width: '53ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/country',
                          label: 'Country',
                          options: {
                            componentProps: {
                              width: '53ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/postalCodeZip',
                          label: 'Postal or zip code',
                          options: {
                            componentProps: {
                              width: '50ch',
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      options: {
        sectionTitle: 'The parties',
        showInTaskList: true,
      },
      label: 'Who is the dispute with?',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: [
                  '## Enter the contact information of the person or condominium corporation the dispute is with.',
                  '<br/>',
                ],
              },
            },
            {
              type: 'Control',
              label: 'First name',
              scope: '#/properties/otherPartyDisputeDetails/properties/otherPartyPrimaryFirstName',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              label: 'Last name',
              scope: '#/properties/otherPartyDisputeDetails/properties/otherPartyPrimaryLastName',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              label: 'Condominium corporation name',
              scope: '#/properties/otherPartyDisputeDetails/properties/otherPartyPrimaryCondoCorporationName',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              label: 'Email',
              scope: '#/properties/otherPartyDisputeDetails/properties/otherPartyPrimaryEmail',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              label: 'Telephone',
              scope: '#/properties/otherPartyDisputeDetails/properties/otherPartyPrimaryTelephone',
              options: {
                componentProps: {
                  type: 'tel',
                  width: '50ch',
                },
              },
            },
            {
              type: 'ListWithDetail',
              scope: '#/properties/otherPartyDisputeDetails/properties/additionalRespondents',
              label: 'Additional respondents',
              options: {
                addButtonType: 'secondary',
                noDataMessage: '',
                itemLabel: 'Respondent',
                addButtonUIProps: {
                  leadingIcon: 'Add',
                },
                componentProps: {
                  withLeftTab: true,
                },
                detail: {
                  type: 'VerticalLayout',
                  elements: [
                    {
                      type: 'VerticalLayout',
                      elements: [
                        {
                          type: 'Control',
                          scope: '#/properties/respondentFirstName',
                          label: 'First Name',
                          options: {
                            componentProps: {
                              width: '50ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/respondentLastName',
                          label: 'Last Name',
                          options: {
                            componentProps: {
                              width: '50ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/respondentCondoCorpName',
                          label: 'Organization or business name',
                          options: {
                            componentProps: {
                              width: '50ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/respondentEmail',
                          label: 'Email',
                          options: {
                            componentProps: {
                              width: '50ch',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/respondentTelephone',
                          label: 'Telephone',
                          options: {
                            componentProps: {
                              type: 'tel',
                              width: '50ch',
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      options: {
        sectionTitle: 'The parties',
        showInTaskList: true,
      },
      label: "What is the mailing address of the person or organization you're having the dispute with?",
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: [
                  "## What is the mailing address of the person or organization you're having the dispute with?",
                  '<br/>',
                  '### Please include as much information as you can.',
                  '<br/>',
                ],
              },
            },
            {
              type: 'Control',
              scope: '#/properties/primaryRespondentMailAddress/properties/addressLine1',
              options: {
                help: 'For example, house number and street name',
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/primaryRespondentMailAddress/properties/addressLine2',
              options: {
                help: 'For example, apartment, suite, unit, building, floor, etc.',
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/primaryRespondentMailAddress/properties/city',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/primaryRespondentMailAddress/properties/provinceState',
              label: 'Province or state',
              options: {
                componentProps: {
                  width: '40ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/primaryRespondentMailAddress/properties/country',
              options: {
                componentProps: {
                  width: '40ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/primaryRespondentMailAddress/properties/postalCodeZip',
              label: 'Postal or zip code',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      options: {
        sectionTitle: 'The parties',
        showInTaskList: true,
      },
      label: 'Does the applicant have a representative?',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: [
                  '## Does the applicant have a representative?',
                  '<br/>',
                  '### Applicants can apply on their own or with a lawyer or representative. A lawyer or representative is not required to apply or take part in this process.',
                  '<br/>',
                ],
              },
            },
            {
              type: 'Control',
              scope: '#/properties/fillingApplicationOnbehalf',
              label: ' ',
              options: {
                format: 'radio',
                componentProps: {
                  orientation: 'vertical',
                },
              },
            },
            {
              type: 'Callout',
              options: {
                componentProps: {
                  type: 'important',
                  maxWidth: '800px',
                  emphasis: 'low',
                  message:
                    'If you are a personal representative applying on behalf of the applicant, please sign and upload this form as part of the application.',
                },
              },
              rule: {
                effect: 'SHOW',
                condition: {
                  scope: '#/properties/fillingApplicationOnbehalf',
                  schema: {
                    enum: ['Yes - I have a personal representative'],
                  },
                },
              },
            },
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: [
                  '[Download authorization form for personal representative](http://cfr.forms.gov.ab.ca/Form/CD15071)',
                  '<br/>',
                ],
              },
              rule: {
                effect: 'SHOW',
                condition: {
                  scope: '#/properties/fillingApplicationOnbehalf',
                  schema: {
                    enum: ['Yes - I have a personal representative'],
                  },
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      label: 'What are their contact details?',
      options: {
        sectionTitle: 'The parties',
        showInTaskList: false,
      },
      rule: {
        effect: 'HIDE',
        condition: {
          scope: '#/properties/fillingApplicationOnbehalf',
          schema: {
            not: {
              enum: ['Yes - lawyer', 'Yes - I have a personal representative'],
            },
            required: ['representativeContactInformation'],
          },
        },
      },
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: ['## What are the representative’s contact details?', '<br/>'],
              },
            },
            {
              type: 'Control',
              scope: '#/properties/representativeContactInformation/properties/primaryFirstName',
              label: 'First name',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              label: 'Last name',
              scope: '#/properties/representativeContactInformation/properties/primaryLastName',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/representativeContactInformation/properties/primaryOrganizationBusinessName',
              label: 'Organization or business name',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/representativeContactInformation/properties/primaryEmail',
              label: 'Email',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              label: 'Phone',
              scope: '#/properties/representativeContactInformation/properties/primaryPhone',
              options: {
                componentProps: {
                  type: 'tel',
                  placeholder: '',
                  width: '50ch',
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      label: 'What is their mailing address?',
      options: {
        sectionTitle: 'The parties',
        showInTaskList: false,
      },
      rule: {
        effect: 'HIDE',
        condition: {
          scope: '#/properties/fillingApplicationOnbehalf',
          schema: {
            not: {
              enum: ['Yes - lawyer', 'Yes - I have a personal representative'],
            },
          },
        },
      },
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: ['## What is the representative’s mailing address', '<br/>'],
              },
            },
            {
              type: 'Control',
              scope: '#/properties/representatitiveMailAddress/properties/addressLine1',
              label: 'Address line 1',
              options: {
                help: 'For example, house number and street name',
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/representatitiveMailAddress/properties/addressLine2',
              label: 'Address line 2',
              options: {
                help: 'For example, apartment, suite, unit, building, floor, etc.',
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/representatitiveMailAddress/properties/city',
              label: 'City',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/representatitiveMailAddress/properties/provinceState',
              label: 'Province',
              options: {
                componentProps: {
                  width: '54ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/representatitiveMailAddress/properties/country',
              label: 'Country',
              options: {
                componentProps: {
                  width: '54ch',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/representatitiveMailAddress/properties/postalCodeZip',
              label: 'Postal or zip code',
              options: {
                componentProps: {
                  width: '50ch',
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      options: {
        sectionTitle: 'Describe the dispute',
        showInTaskList: true,
      },
      label: 'When did the applicant first become aware of this dispute?',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: ['## When did the applicant first become aware of this dispute?', '<br/>'],
              },
            },
            {
              type: 'Control',
              scope: '#/properties/whenDidIssueHappen/properties/whenWasIssueDate',
              label: 'Dispute date',
              options: {
                componentProps: {
                  width: '20ch',
                  mb: 'm',
                },
              },
            },
            //Commenting this out as it needed for now.
            // {
            //   type: 'Control',
            //   scope: '#/properties/isIssueStillHappening',
            //   label: 'Is the dispute still happening?',
            //   options: {
            //     format: 'radio',
            //     componentProps: {
            //       orientation: 'vertical',
            //     },
            //   },
            // },
          ],
        },
      ],
    },
    {
      type: 'Category',
      options: {
        sectionTitle: 'Describe the dispute',
        showInTaskList: true,
      },
      label: 'What are the details of the dispute?',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: ['## What are the details of the dispute?', '<br/>'],
              },
            },
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: [
                  'Details of the dispute may include: ',
                  '- A description of what happened, <strong>including dates and times</strong>',
                  "- Any steps you've already taken to resolve the dispute",
                  '- The names of any individuals involved who are not already listed in the application',
                  '- Any other information you think is relevant',
                  '<br/>',
                ],
              },
            },
            {
              type: 'Control',
              scope: '#/properties/describeDispute/properties/disputeDescription',
              label: 'Dispute description.',
              options: {
                multi: true,
                componentProps: {
                  rows: 10,
                  cols: 100,
                  countBy: 'character',
                  maxCount: 2000,
                  width: '75ch',
                },
              },
            },
            {
              type: 'Callout',
              options: {
                componentProps: {
                  type: 'information',
                  maxWidth: '575px',
                  emphasis: 'low',
                  message:
                    'If you have more information to share. You can upload a detailed description later in the application.',
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      options: {
        sectionTitle: 'Describe the dispute',
        showInTaskList: true,
      },
      label: 'What is the desired outcome?',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: [
                  '## What is the desired outcome?',
                  '<br/>',
                  'Briefly tell us the desired outcome or agreement. You may also upload an explanation in the documents section.',
                  '<br/>',
                ],
              },
            },
            {
              type: 'Control',
              scope: '#/properties/describeDispute/properties/resultOfApplication',
              label: 'Desired outcome.',
              options: {
                multi: true,
                componentProps: {
                  rows: 10,
                  cols: 100,
                  countBy: 'character',
                  maxCount: 500,
                  width: '75ch',
                },
              },
            },
            {
              type: 'Callout',
              options: {
                componentProps: {
                  type: 'information',
                  maxWidth: '575px',
                  emphasis: 'low',
                  message:
                    'If you have more information to share. You can upload a detailed description later in the application.',
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: 'Category',
      options: {
        sectionTitle: 'Describe the dispute',
        showInTaskList: true,
      },
      label: 'Add optional supporting documents',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: ['## Add optional supporting documents', '<br/>'],
              },
            },
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: [
                  'Please upload any documents or files that help explain your side of the dispute, and how they support the issues you selected. Your dispute application will be reviewed by CDRT Administration to ensure it is complete and that the CDRT has the authority to accept it. Your ability to upload documents may be paused during that time.',
                  '<br/>',
                  'If you are uploading a description of your dispute please label it as "Dispute Description".',
                  '<br/>',
                ],
              },
            },
            {
              type: 'HelpContent',
              options: {
                markdown: true,
                help: [
                  'Supporting documents and files might include things like:',
                  '> - Letters or emails',
                  '> - Photos or videos',
                  '> - Meeting notes',
                  '> - Invoices or receipts',
                  '> - Relevant rules, bylaws, or policies',
                  '<br/>',
                ],
              },
            },
            {
              type: 'Callout',
              options: {
                componentProps: {
                  type: 'important',
                  maxWidth: '700px',
                  heading: 'Make sure your application is complete and accurate',
                  message:
                    'When submitting your application, it is your responsibility to ensure the information and documents you provide are complete and accurate. For the full requirements and responsibilities when making an application, refer to the <a href="https://www.alberta.ca/condominium-dispute-resolution-tribunal">CDRT\'s policies and procedures</a>.',
                },
              },
            },
            {
              type: 'Control',
              scope: '#/properties/addSupportingDocuments',
              label: 'Would you like to add documents now?',
              options: {
                format: 'radio',
              },
            },
          ],
        },
      ],
    },
  ],
};
