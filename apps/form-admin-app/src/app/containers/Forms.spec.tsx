import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { Forms } from './Forms';
import { findForms, getDefaultFormCriteria } from '../state';
import { FormStatus } from '../state/types';

jest.mock('../state', () => {
  const actual = jest.requireActual('../state');
  return {
    ...actual,
    findForms: jest.fn((payload) => ({ type: 'form/find-forms', payload })),
    exportForms: jest.fn((payload) => ({ type: 'form/export-forms', payload })),
    loadTopic: jest.fn((payload) => ({ type: 'comment/load-topic', payload })),
    connectStream: jest.fn((payload) => ({ type: 'comment/connect-stream', payload })),
    getTags: jest.fn((payload) => ({ type: 'directory/get-tags', payload })),
    tagResource: jest.fn((payload) => ({ type: 'directory/tag-resource', payload })),
  };
});

const mockStore = configureStore();
const definitionId = 'submission-test';
const formUrn = 'urn:ads:platform:form-service:v1:/forms/form-1';

const createState = ({
  forms = {},
  formResults = [],
  formCriteria = getDefaultFormCriteria(),
}: {
  forms?: Record<string, unknown>;
  formResults?: string[];
  formCriteria?: ReturnType<typeof getDefaultFormCriteria>;
} = {}) => ({
  user: {
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@gov.ab.ca',
      roles: ['urn:ads:platform:form-service:form-admin'],
    },
  },
  form: {
    busy: {
      initializing: false,
      loading: false,
      findPdf: false,
      executing: false,
      exporting: false,
    },
    forms,
    submissions: {},
    definitions: {
      [definitionId]: {
        id: definitionId,
        name: 'Submission test',
        supportTopic: false,
        anonymousApply: false,
        assessorRoles: [],
      },
    },
    pdfs: {},
    dataValues: {
      [definitionId]: [{ name: 'First name', path: 'firstName', type: 'string', selected: true }],
    },
    results: {
      definitions: [],
      forms: formResults,
      submissions: [],
    },
    resultTotals: {
      definitions: 0,
      forms: formResults.length,
      submissions: 0,
    },
    definitionCriteria: {},
    formCriteria,
    submissionCriteria: {},
    next: {
      definitions: null,
      forms: null,
      submissions: null,
    },
    selectedDefinition: definitionId,
    selectedForm: null,
    selectedSubmission: null,
    dispositionDraft: { status: '', reason: '' },
    export: {
      forms: {},
      submissions: {},
    },
  },
  directory: {
    resources: {},
    tags: {},
    resourceTags: {},
    tagResources: {},
    results: [],
    next: null,
    busy: {
      loading: false,
      loadingResourceTags: {},
      executing: false,
    },
  },
  comment: {
    topics: {},
  },
  file: {
    files: {},
    metadata: {},
    busy: {
      download: {},
      metadata: {},
      find: false,
    },
  },
});

const renderForms = (state = createState()) => {
  const store = mockStore(state);
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <Forms definitionId={definitionId} />
      </MemoryRouter>
    </Provider>,
  );

  return { store, ...view };
};

describe('Forms', () => {
  beforeEach(() => {
    (findForms as unknown as jest.Mock).mockClear();
  });

  it('should render the forms table and filters trigger', () => {
    const { baseElement, getByText } = renderForms(
      createState({
        forms: {
          'form-1': {
            urn: formUrn,
            id: 'form-1',
            formId: 'form-1',
            status: FormStatus.submitted,
            created: '2026-08-01T12:00:00.000Z',
            submitted: '2026-08-01T12:00:00.000Z',
            lastAccessed: '2026-08-01T12:00:00.000Z',
            createdBy: { id: 'user-1', name: 'Test User' },
            applicant: { addressAs: 'Test User' },
            data: { firstName: 'Ada' },
          },
        },
        formResults: ['form-1'],
      }),
    );

    expect(getByText('Created on')).toBeTruthy();
    expect(getByText('Ada')).toBeTruthy();
    expect(baseElement.querySelector("goa-button[testId='show-filters']")).toBeTruthy();
    expect(baseElement.querySelector("goa-button[testId='export-forms']")).toBeTruthy();
  });

  it('should dispatch findForms on mount when no forms are loaded', () => {
    renderForms();

    expect(findForms).toHaveBeenCalledWith({
      definitionId,
      criteria: getDefaultFormCriteria(),
    });
  });

  it('should show the active filter badge for default form criteria', () => {
    const { baseElement } = renderForms();

    expect(baseElement.querySelector("goa-badge[testId='active-filter-count']").getAttribute('content')).toBe(
      '2 active',
    );
  });

  it('should keep filter controls mounted and find forms from the drawer', () => {
    const { baseElement } = renderForms();

    expect(baseElement.querySelector("goa-dropdown[name='form-status']")).toBeTruthy();

    fireEvent(baseElement.querySelector("goa-button[testId='find-forms']"), new CustomEvent('_click'));

    expect(findForms).toHaveBeenCalledWith({
      definitionId,
      criteria: getDefaultFormCriteria(),
      after: undefined,
    });
  });

  it('should hide the filters trigger while the drawer is open', () => {
    const { baseElement } = renderForms();

    fireEvent(baseElement.querySelector("goa-button[testId='show-filters']"), new CustomEvent('_click'));

    expect(baseElement.querySelector("goa-push-drawer[testid='filter-drawer']").getAttribute('open')).toBe('true');
    expect(baseElement.querySelector("goa-button[testId='show-filters']")).toBeFalsy();
  });
});
