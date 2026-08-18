import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { FormSubmissions } from './FormSubmissions';
import { findSubmissions, getDefaultSubmissionCriteria } from '../state';
import { FormDefinition, ReviewConfiguration } from '../state/types';

jest.mock('../state', () => {
  const actual = jest.requireActual('../state');
  return {
    ...actual,
    findSubmissions: jest.fn((payload) => ({ type: 'form/find-submissions', payload })),
    exportSubmissions: jest.fn((payload) => ({ type: 'form/export-submissions', payload })),
    getTags: jest.fn((payload) => ({ type: 'directory/get-tags', payload })),
    tagResource: jest.fn((payload) => ({ type: 'directory/tag-resource', payload })),
  };
});

const mockStore = configureStore();
const definitionId = 'intake';
const submissionUrn = 'urn:ads:platform:form-service:v1:/submissions/sub-1';

const dataSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', title: 'First name' },
    lastName: { type: 'string', title: 'Last name' },
    fileNumber: { type: 'number', title: 'File number' },
  },
};

const createState = ({
  submissions = {},
  submissionResults = [],
  reviewConfiguration = { columns: [{ path: 'lastName' }, { path: 'firstName' }] } as ReviewConfiguration,
}: {
  submissions?: Record<string, unknown>;
  submissionResults?: string[];
  reviewConfiguration?: ReviewConfiguration;
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
    forms: {},
    submissions,
    definitions: {
      [definitionId]: {
        id: definitionId,
        name: 'Intake',
        supportTopic: false,
        anonymousApply: false,
        assessorRoles: [],
        dataSchema,
        reviewConfiguration,
      } as Partial<FormDefinition>,
    },
    pdfs: {},
    results: {
      definitions: [],
      forms: [],
      submissions: submissionResults,
    },
    resultTotals: {
      definitions: 0,
      forms: 0,
      submissions: submissionResults.length,
    },
    definitionCriteria: {},
    formCriteria: {},
    submissionCriteria: getDefaultSubmissionCriteria(),
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

const loadedSubmission = {
  urn: submissionUrn,
  id: 'sub-1',
  formId: 'form-1',
  formDefinitionId: definitionId,
  formData: { firstName: 'Ada', lastName: 'Lovelace', fileNumber: 42 },
  formFiles: {},
  created: '2026-08-01T12:00:00.000Z',
  createdBy: { id: 'user-1', name: 'Test User' },
  disposition: { id: 'approved', status: 'Approved', reason: 'Eligible', date: '2026-08-02T12:00:00.000Z' },
  updated: '2026-08-02T12:00:00.000Z',
  updatedBy: { id: 'user-1', name: 'Test User' },
  hash: 'submission-hash',
};

const renderSubmissions = (state = createState()) => {
  const store = mockStore(state);
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <FormSubmissions definitionId={definitionId} />
      </MemoryRouter>
    </Provider>,
  );

  return { store, ...view };
};

const headerLabels = (baseElement: HTMLElement): string[] =>
  Array.from(baseElement.querySelectorAll('thead th')).map((header) => header.textContent);

describe('FormSubmissions', () => {
  beforeEach(() => {
    (findSubmissions as unknown as jest.Mock).mockClear();
  });

  it('should keep system columns first in the submissions table', () => {
    const { baseElement } = renderSubmissions(
      createState({
        submissions: { 'sub-1': loadedSubmission },
        submissionResults: ['sub-1'],
      }),
    );

    expect(headerLabels(baseElement).slice(0, 3)).toEqual(['Submitted on', 'Disposition', 'Tags']);
  });

  it('should render review configuration columns in the specified order', () => {
    const { baseElement, getByText } = renderSubmissions(
      createState({
        submissions: { 'sub-1': loadedSubmission },
        submissionResults: ['sub-1'],
      }),
    );

    expect(headerLabels(baseElement)).toEqual([
      'Submitted on',
      'Disposition',
      'Tags',
      'Last name',
      'First name',
      'Actions',
    ]);
    expect(getByText('Lovelace')).toBeTruthy();
    expect(getByText('Ada')).toBeTruthy();
  });

  it('should not render submitted values that are not in the review configuration', () => {
    const { queryByText } = renderSubmissions(
      createState({
        submissions: { 'sub-1': loadedSubmission },
        submissionResults: ['sub-1'],
      }),
    );

    expect(queryByText('File number')).toBeNull();
    expect(queryByText('42')).toBeNull();
  });

  it('should show only system columns when no review configuration is specified', () => {
    const { baseElement } = renderSubmissions(
      createState({
        submissions: { 'sub-1': loadedSubmission },
        submissionResults: ['sub-1'],
        reviewConfiguration: { columns: [] },
      }),
    );

    expect(headerLabels(baseElement)).toEqual(['Submitted on', 'Disposition', 'Tags', 'Actions']);
  });

  it('should dispatch findSubmissions on mount when no submissions are loaded', () => {
    renderSubmissions();

    expect(findSubmissions).toHaveBeenCalledWith({
      definitionId,
      criteria: getDefaultSubmissionCriteria(),
    });
  });

  it('should keep filter controls mounted and find submissions from the drawer', () => {
    const { baseElement } = renderSubmissions();

    expect(baseElement.querySelector("goa-dropdown[name='submission-disposition']")).toBeTruthy();

    fireEvent(baseElement.querySelector("goa-button[testId='find-submissions']"), new CustomEvent('_click'));

    expect(findSubmissions).toHaveBeenCalledWith({
      definitionId,
      criteria: getDefaultSubmissionCriteria(),
      after: undefined,
    });
  });
});
