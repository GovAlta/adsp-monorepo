import { Dispatch } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Category, UISchemaElement } from '@jsonforms/core';
import { ContextProviderFactory, GoARenderers, GoABaseTableReviewRenderers, ReviewContext } from '../../../index';
import Ajv from 'ajv';
import { JsonForms } from '@jsonforms/react';

import { CategorizationStepperLayoutRendererProps } from '../FormStepper/types';
import { JsonFormsStepperContextProvider } from '../FormStepper/context';

const getFormBase = (uiSchema: UISchemaElement, schema: object, data: object, onEdit?: () => void): JSX.Element => {
  return (
    <ReviewContext.Provider value={{ onEdit: onEdit || jest.fn() }}>
      <JsonForms
        uischema={uiSchema}
        data={data}
        schema={schema}
        ajv={new Ajv({ allErrors: true, verbose: true })}
        renderers={GoABaseTableReviewRenderers}
      />
    </ReviewContext.Provider>
  );
};

const arrayUischema = {
  type: 'Categorization',
  options: {
    variant: 'pages',
    showNavButtons: true,
  },
  elements: [
    {
      type: 'Category',
      label: 'Technical',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/keywords',
              label: 'Keywords',
              componentProps: {
                placeholder: 'Single keyword',
              },
            },
          ],
        },
      ],
    },
  ],
};

const arrayDataSchema = {
  type: 'object',
  properties: {
    keywords: {
      type: 'array',
      description: 'Relevant keywords to help users find the service through search',
      items: {
        type: 'object',
        properties: {
          item: {
            type: 'string',
            maxLength: 25,
            description: 'Single keyword',
          },
        },
      },
    },
  },
};

const arrayData = {
  keywords: [
    {
      item: 'cheese',
    },
    {
      item: 'avocado',
    },
  ],
};

const listWithDetailsSchema = {
  type: 'object',
  properties: {
    roadmap: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          when: {
            type: 'string',
            pattern: '^[0-9]{4} Q[1-4]$|^(TBD)$',
            description: "Either a quarter shown as 'YYYY Q#' or TBD",
          },
          title: {
            type: 'string',
            description: 'About 50-60 characters',
          },
          status: {
            type: 'string',
            enum: ['', 'Committed', 'Tentative'],
          },
          type: {
            type: 'string',
            enum: ['', 'Addition', 'Alteration', 'Deprecation', 'Removal', 'Fix', 'Security Improvement', 'Other'],
          },
          description: {
            type: 'string',
            maxLength: 400,
            description: 'A brief summary of the change',
          },
          impacts: {
            type: 'string',
            description: 'A list of impacts',
          },
          impactsArray: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                item: {
                  type: 'string',
                },
              },
            },
          },
        },
        required: ['when', 'title', 'status', 'type', 'description', 'impacts'],
      },
    },
  },
  required: ['roadmap'],
};

const listWithDetailsUiSchema = {
  type: 'Categorization',
  options: {
    variant: 'pages',
    showNavButtons: true,
  },
  elements: [
    {
      type: 'Category',
      label: 'Roadmap',
      elements: [
        {
          type: 'HelpContent',
          label: 'Why is this information needed?',
          options: {
            variant: 'details',
            help: [
              'Enhance Collaboration and Alignment: User teams are likely to adopt services that are expected to have long-term utility.',
              'Facilitate Risk Management and Contingency Planning: User teams can proactively identify potential challenges and resolve them earlier.',
            ],
          },
        },
        {
          type: 'HelpContent',
          label: 'Roadmap fields',
          options: {
            variant: 'details',
            help: [
              'When: Estimated timelines for the implementation of these changes.',
              'Title: A list of planned changes, features, or enhancements.',
              'Roadmap Status: Indicate whether the changes are committed or tentative.',
              'Type of Change: Specify the type of change (e.g., addition, security improvement, bug fix, removal, deprecation).',
              'Description: Details of the changes planned.',
              'Impact: Describe the potential impact of the changes on users and other services.',
            ],
          },
        },
        {
          type: 'ListWithDetail',
          scope: '#/properties/roadmap',
          label: 'Roadmap item',
          options: {
            detail: {
              type: 'VerticalLayout',
              elements: [
                {
                  type: 'VerticalLayout',
                  elements: [
                    {
                      type: 'Control',
                      scope: '#/properties/when',
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/title',
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/status',
                      label: 'Roadmap Status',
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/type',
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/description',
                      lable: 'Description',
                      options: {
                        multi: true,
                        componentProps: {
                          rows: 6,
                        },
                      },
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/impacts',
                      options: {
                        multi: true,
                        componentProps: {
                          rows: 7,
                          placeholder: 'A list of impacts.\nPlease separate each item with a new line (enter key)',
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
};

const ListWithDetailsData = {
  roadmap: [
    {
      when: 'TBD',
      title: 'Hello world',
      status: 'Committed',
      type: 'Addition',
      description: 'This is a description',
      impacts: 'This is an impact',
    },
    {
      when: 'TBD',
      title: 'Another title',
      status: 'Tentative',
      type: 'Alteration',
      description: 'Another Description',
      impacts: 'More impacts',
    },
  ],
};

const nestedListWithDetailsSchema = {
  type: 'object',
  properties: {
    contact: {
      type: 'object',
      properties: {
        details: {
          type: 'string',
          description: 'Special requirements when contacting',
        },
        methods: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['BERNIE', 'GitHub', 'Slack', 'Web', 'Phone', 'Email'],
              },
              value: {
                type: 'string',
                description: 'Display name',
              },
              url: {
                type: 'string',
                pattern:
                  '^(https?://)?(www.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{2,6}([-a-zA-Z0-9()@:%_+.~#?&/=]*)$|^\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}$',
              },
            },
          },
          required: ['type', 'url'],
        },
      },
    },
  },
};

const nestedListWithDetailsUiSchema = {
  type: 'Categorization',
  options: {
    variant: 'pages',
    showNavButtons: true,
  },
  elements: [
    {
      type: 'Category',
      label: 'Contact',
      elements: [
        {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'HelpContent',
              label: 'Contact',
              options: {
                variant: 'details',
                help: [
                  'Email: Primary email address for service-related inquiries.',
                  'Slack: Slack handle or channel for real-time communication.',
                  'Phone Number: Your phone number for urgent or sensitive matters.',
                  "GitHub Repository: Link to the service's GitHub repository for code access and issue tracking.",
                  "Website: Link to the service's website or documentation portal.",
                  'Notes: Any additional contact information or preferred communication methods.',
                ],
              },
            },
            {
              type: 'Control',
              scope: '#/properties/contact/properties/details',
              label: 'Note (optional)',
            },
            {
              type: 'ListWithDetail',
              scope: '#/properties/contact/properties/methods',
              label: 'Contact methods',
              options: {
                itemLabel: 'Method',
              },
              elements: [
                {
                  type: 'HorizontalLayout',
                  elements: [
                    {
                      type: 'Control',
                      scope: '#/properties/type',
                      label: 'Using',
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/value',
                      label: 'Display name',
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/url',
                      label: 'Contact value',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const nestedListWithDetailsData = {
  contact: {
    details: 'asdfasdf',
    methods: [
      {
        type: 'BERNIE',
        url: 'asdfasdf',
        value: 'asdf',
      },
      {
        type: 'GitHub',
        value: 'asfasdf',
        url: 'asdfasdf',
      },
    ],
  },
};

// eslint-disable-next-line
type TestProps = CategorizationStepperLayoutRendererProps & { customDispatch: Dispatch<any> } & { activeId: number };
const mockDispatch = jest.fn();

const stepperBasePropsReview: TestProps = {
  uischema: arrayUischema,
  schema: arrayDataSchema,
  data: arrayData,
  enabled: true,
  direction: 'column',
  visible: true,
  path: 'test-path',
  ajv: new Ajv({ allErrors: true, verbose: true }),
  t: jest.fn(),
  locale: 'en',
  activeId: 0,
  customDispatch: mockDispatch,
};

describe('page review arrays', () => {
  it('can render the review page with root array', async () => {
    stepperBasePropsReview.activeId = 1;
    const renderer = render(
      <JsonFormsStepperContextProvider
        StepperProps={stepperBasePropsReview}
        children={getFormBase(arrayUischema, arrayDataSchema, arrayData)}
      />
    );

    const reviewPage = screen.getByTestId('stepper-pages-review-page');
    expect(reviewPage).toHaveTextContent('avocado');
    expect(reviewPage).toHaveTextContent('cheese');
  });
  it('can render list with details in review page', async () => {
    const newStepperReview = {
      ...stepperBasePropsReview,
      schema: listWithDetailsSchema,
      uischema: listWithDetailsUiSchema,
    };

    newStepperReview.activeId = 1;
    const renderer = render(
      <JsonFormsStepperContextProvider
        StepperProps={newStepperReview}
        children={getFormBase(listWithDetailsUiSchema, listWithDetailsSchema, ListWithDetailsData)}
      />
    );
    const reviewPage = screen.getByTestId('stepper-pages-review-page');
    expect(reviewPage).toHaveTextContent('Hello world');
    expect(reviewPage).toHaveTextContent('This is a description');
    expect(reviewPage).toHaveTextContent('This is an impact');
    expect(reviewPage).toHaveTextContent('TBD');
    expect(reviewPage).toHaveTextContent('Another Description');
  });

  it('can render nested list with details in review page', async () => {
    const newStepperReview = {
      ...stepperBasePropsReview,
      schema: nestedListWithDetailsSchema,
      uischema: nestedListWithDetailsUiSchema,
    };

    newStepperReview.activeId = 1;
    const renderer = render(
      <JsonFormsStepperContextProvider
        StepperProps={newStepperReview}
        children={getFormBase(nestedListWithDetailsUiSchema, nestedListWithDetailsSchema, nestedListWithDetailsData)}
      />
    );

    const reviewPage = screen.getByTestId('stepper-pages-review-page');
    expect(reviewPage).toHaveTextContent('BERNIE');
    expect(reviewPage).toHaveTextContent('GitHub');
  });
});
