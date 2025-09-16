import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import '@testing-library/jest-dom';

import { Provider } from 'react-redux';

import configureMockStore from 'redux-mock-store';

import { FormSubmissionReviewTask } from './FormSubmissionReviewTask';
import { Task, TaskUser } from '../../state';
import thunk from 'redux-thunk';
interface TaskAssignmentModalProps {
  user: TaskUser;
  task: Task;
  isExecuting: boolean;
  onClose: () => void;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

jest.mock('@jsonforms/core', () => ({
  ...jest.requireActual('@jsonforms/core'),
  isVisible: jest.fn(() => true), // Mocking isVisible to always return true
  isEnabled: jest.fn(() => true), // Mocking isEnabled to always return true
}));

const user = {
  id: '07ec41de-469e-4c77-987d-c734d59830a4',
  name: 'auto.test@gov.ab.ca',
  email: 'auto.test@gov.ab.ca',
  isAssigner: true,
  isWorker: true,
};

const task: Task = {
  urn: 'urn:ads:platform:task-service:v1:/tasks/ba0b54f0-e808-4384-a990-3ee2115a6db7',
  id: 'ba0b54f0-e808-4384-a990-3ee2115a6db7',
  name: 'Process form submission',
  description:
    "Process form 'a3' (ID: 41ca1a06-959f-45c9-8636-17ee0ba3528d) submission: (cd51e007-0428-4690-a58f-7f11df030b14)",
  queue: { namespace: 'Form-Submission-Queue', name: 'Form-Submission-Queue' },
  recordId:
    'urn:ads:platform:form-service:v1:/forms/c36b55a3-0d74-4d1b-9779-b4788c76e52a/submissions/cd51e007-0428-4690-a58f-7f11df030b14',
  status: 'Pending',
  priority: 'Normal',
  createdOn: new Date('2024-05-02T00:11:48.051Z'),
  assignment: null,
};

const staticProps: TaskAssignmentModalProps = {
  user: user,
  task: task,
  isExecuting: true,
  onClose: jest.fn(),
  onStart: jest.fn(),
  onComplete: jest.fn(),
  onCancel: jest.fn(),
};

const mockStore = configureMockStore([thunk]);

describe('form submission review task', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      file: {
        files: {
          'urn:ads:platform:file-service:v1:/files/dc074c1b-d512-43d2-974a-2265575b5c9f':
            'data:application/octet-stream;base64,ZGlmZiAtLWdpdCBhL2FwcHMvdGVuYW50LW1hbmFnZW1lbnQtd2ViYXBwL3NyYy9hcHAvcGFnZXMvYWRtaW4vc2Vydmlj',
        },
        metadata: {
          'urn:ads:platform:file-service:v1:/files/dc074c1b-d512-43d2-974a-2265575b5c9f': {
            urn: 'urn:ads:platform:file-service:v1:/files/dc074c1b-d512-43d2-974a-2265575b5c9f',
            id: 'dc074c1b-d512-43d2-974a-2265575b5c9f',
            filename: 'height.diff',
            size: 2235,
            typeName: 'Form supporting documents',
            recordId: 'urn:ads:platform:form-service:v1:/forms/c36b55a3-0d74-4d1b-9779-b4788c76e52a',
            created: '2024-04-29T22:25:09.399Z',
            createdBy: {
              id: '74419906-eecc-48d4-9dc5-5d2c5ab72e60',
              name: 'Jonathan Weyermann',
            },
            lastAccessed: '2024-05-02T21:40:06.083Z',
            scanned: true,
            infected: false,
            mimeType: 'application/octet-stream',
            digest: 'sha256-ZF/SzqO/iItz1alXdepwQEH1Usxs+ICWGo0sXmKFsGU=',
            securityClassification: 'protected b',
          },
          'urn:ads:platform:file-service:v1:/files/643547a9-86ea-4dda-b7c3-c8d3d282f18d': {
            urn: 'urn:ads:platform:file-service:v1:/files/643547a9-86ea-4dda-b7c3-c8d3d282f18d',
            id: '643547a9-86ea-4dda-b7c3-c8d3d282f18d',
            filename: 'local-setup.txt',
            size: 36775,
            typeName: 'Form supporting documents',
            recordId: 'urn:ads:platform:form-service:v1:/forms/c36b55a3-0d74-4d1b-9779-b4788c76e52a',
            created: '2024-04-29T22:25:17.681Z',
            createdBy: {
              id: '74419906-eecc-48d4-9dc5-5d2c5ab72e60',
              name: 'Jonathan Weyermann',
            },
            lastAccessed: '2024-05-02T21:40:11.612Z',
            scanned: true,
            infected: false,
            mimeType: 'application/octet-stream',
            digest: 'sha256-ySucmYJ4eor99pXubbnW3djQak1tQyORqmZPka+eRmw=',
            securityClassification: 'protected b',
          },
        },
        busy: {
          download: {
            'urn:ads:platform:file-service:v1:/files/dc074c1b-d512-43d2-974a-2265575b5c9f': false,
            'urn:ads:platform:file-service:v1:/files/643547a9-86ea-4dda-b7c3-c8d3d282f18d': false,
          },
          metadata: {},
        },
      },
      form: {
        busy: {
          initializing: false,
          loading: false,
          executing: false,
        },
        forms: {
          'c36b55a3-0d74-4d1b-9779-b4788c76e52a': {
            urn: 'urn:ads:platform:form-service:v1:/forms/c36b55a3-0d74-4d1b-9779-b4788c76e52a/submissions/405345c3-ce67-4e8f-bf0e-3d8049235c85',
            id: '405345c3-ce67-4e8f-bf0e-3d8049235c85',
            formId: 'c36b55a3-0d74-4d1b-9779-b4788c76e52a',
            formDefinitionId: 'aa',
            formData: {
              firstName: 'Bob',
              secondName: 'Smith',
              fileUploader: 'urn:ads:platform:file-service:v1:/files/dc074c1b-d512-43d2-974a-2265575b5c9f',
              fileUploader2: 'urn:ads:platform:file-service:v1:/files/643547a9-86ea-4dda-b7c3-c8d3d282f18d',
              birthDate: '1111-11-11',
              nationality: 'US',
              vegetarianOptions: {
                favoriteVegetable: 'Potato',
                vegan: true,
              },
            },
            formFiles: {
              fileUploader: 'urn:ads:platform:file-service:v1:/files/dc074c1b-d512-43d2-974a-2265575b5c9f',
              fileUploader2: 'urn:ads:platform:file-service:v1:/files/643547a9-86ea-4dda-b7c3-c8d3d282f18d',
            },
            created: '2024-04-29T22:25:44.295Z',
            createdBy: {
              id: '74419906-eecc-48d4-9dc5-5d2c5ab72e60',
              name: 'Jonathan Weyermann',
            },
            disposition: null,
            updated: '2024-04-29T22:25:44.295Z',
            updatedBy: {
              id: '74419906-eecc-48d4-9dc5-5d2c5ab72e60',
              name: 'Jonathan Weyermann',
            },
            hash: 'b9a8129d96414aae0da9b6857cae3923d8896301',
          },
        },
        definitions: {
          aa: {
            id: 'aa',
            name: 'aa',
            description: '',
            anonymousApply: false,
            applicantRoles: [],
            assessorRoles: [],
            clerkRoles: [],
            formDraftUrlTemplate: 'https://form.adsp-dev.gov.ab.ca/autotest/aa',
            dataSchema: {
              type: 'object',
              properties: {
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
                vegetarian: {
                  type: 'boolean',
                },
                birthDate: {
                  type: 'string',
                  format: 'date',
                  description: 'Please enter your birth date.',
                },
                nationality: {
                  type: 'string',
                  enum: ['DE', 'IT', 'JP', 'US', 'RU', 'Other'],
                },
                provideAddress: {
                  type: 'boolean',
                },
                address: {
                  type: 'object',
                  properties: {
                    street: {
                      type: 'string',
                    },
                    streetNumber: {
                      type: 'string',
                    },
                    city: {
                      type: 'string',
                    },
                    postalCode: {
                      type: 'string',
                      maxLength: 5,
                    },
                  },
                },
                vegetarianOptions: {
                  type: 'object',
                  properties: {
                    vegan: {
                      type: 'boolean',
                    },
                    favoriteVegetable: {
                      type: 'string',
                      enum: ['Tomato', 'Potato', 'Salad', 'Aubergine', 'Cucumber', 'Other'],
                    },
                    otherFavoriteVegetable: {
                      type: 'string',
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
                carBrands: {
                  type: 'string',
                  enum: [''],
                },
                countries: {
                  type: 'string',
                  enum: [''],
                },
                dogBreeds: {
                  type: 'string',
                  enum: [''],
                },
                basketballPlayers: {
                  type: 'string',
                  enum: [''],
                },
              },
            },
            uiSchema: {
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
                        {
                          type: 'Control',
                          scope: '#/properties/carBrands',
                          options: {
                            enumContext: {
                              key: 'car-brands',
                              url: 'https://parallelum.com.br/fipe/api/v1/carros/marcas',
                              values: 'nome',
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/dogBreeds',
                          options: {
                            enumContext: {
                              key: 'dog-list',
                              url: 'https://dog.ceo/api/breeds/list/all',
                              location: 'message',
                              type: 'keys',
                            },
                          },
                        },
                      ],
                    },
                    {
                      type: 'HorizontalLayout',
                      elements: [
                        {
                          type: 'Control',
                          scope: '#/properties/basketballPlayers',
                          options: {
                            autocomplete: true,
                            enumContext: {
                              key: 'basketball-players',
                              location: 'data',
                              url: 'https://www.balldontlie.io/api/v1/players',
                              values: ['first_name', 'last_name'],
                            },
                          },
                        },
                        {
                          type: 'Control',
                          scope: '#/properties/countries',
                          options: {
                            autocomplete: true,
                            enumContext: {
                              key: 'countries',
                            },
                          },
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
                  rule: {
                    effect: 'SHOW',
                    condition: {
                      scope: '#/properties/provideAddress',
                      schema: {
                        const: true,
                      },
                    },
                  },
                },
                {
                  type: 'Category',
                  label: 'Additional Information',
                  elements: [
                    {
                      type: 'Control',
                      scope: '#/properties/vegetarianOptions/properties/vegan',
                    },
                    {
                      type: 'Control',
                      scope: '#/properties/vegetarianOptions/properties/favoriteVegetable',
                    },
                  ],
                },
              ],
              options: {
                variant: 'stepper',
                showNavButtons: true,
              },
            },
          },
        },
        selected: 'c36b55a3-0d74-4d1b-9779-b4788c76e52a',
      },
    });
  });
  it('can render form submission review task', () => {
    const props = staticProps;
    const component = render(
      <Provider store={store}>
        <FormSubmissionReviewTask {...props} />
      </Provider>
    );

    expect(component.getByText('Personal Information')).toBeInTheDocument();
    expect(component.getByText('Address Information')).toBeInTheDocument();
    expect(component.getByText('Additional Information')).toBeInTheDocument();
    expect(component.getByText('Close')).toBeInTheDocument();

    expect(component.getByText('Bob')).toBeInTheDocument();
    expect(component.getByText('Smith')).toBeInTheDocument();
    expect(component.getByText('1111-11-11')).toBeInTheDocument();
    expect(component.getByText('US')).toBeInTheDocument();
    expect(component.getByText('Potato')).toBeInTheDocument();
  });
});
