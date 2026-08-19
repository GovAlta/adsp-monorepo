import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { FormSubmissions } from './FormSubmissions';
import {
  DATA_VALUE_SORT_MAX_RESULTS,
  findSubmissions,
  getDefaultResultsSort,
  getDefaultSubmissionCriteria,
} from '../state';
import { DATA_VALUE_SORT_NOTICE_ID } from '../components/DataValueSortNotice';

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
const definitionId = 'submission-test';
const submissionUrn = 'urn:ads:platform:form-service:v1:/submissions/submission-1';

const createState = ({
  submissions = {},
  submissionResults = [],
  submissionCriteria = getDefaultSubmissionCriteria(),
  submissionSort = getDefaultResultsSort(),
}: {
  submissions?: Record<string, unknown>;
  submissionResults?: string[];
  submissionCriteria?: ReturnType<typeof getDefaultSubmissionCriteria>;
  submissionSort?: ReturnType<typeof getDefaultResultsSort>;
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
    submissionCriteria,
    formSort: getDefaultResultsSort(),
    submissionSort,
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

describe('FormSubmissions', () => {
  beforeEach(() => {
    (findSubmissions as unknown as jest.Mock).mockClear();
  });

  it('should render the submissions table', () => {
    const { getByText } = renderSubmissions(
      createState({
        submissions: {
          'submission-1': {
            urn: submissionUrn,
            id: 'submission-1',
            formId: 'form-1',
            created: '2026-08-01T12:00:00.000Z',
            updated: '2026-08-01T12:00:00.000Z',
            createdBy: { id: 'user-1', name: 'Test User' },
            disposition: { id: 'accepted', status: 'accepted', reason: '', date: '2026-08-02T12:00:00.000Z' },
            formData: { firstName: 'Ada' },
          },
        },
        submissionResults: ['submission-1'],
      }),
    );

    expect(getByText('Submitted on')).toBeTruthy();
    expect(getByText('Ada')).toBeTruthy();
  });

  it('should dispatch findSubmissions on mount when no submissions are loaded', () => {
    renderSubmissions();

    expect(findSubmissions).toHaveBeenCalledWith({
      definitionId,
      criteria: getDefaultSubmissionCriteria(),
      sort: getDefaultResultsSort(),
    });
  });

  it('should indicate the submitted on column is sorted descending by default', () => {
    const { baseElement } = renderSubmissions();

    expect(baseElement.querySelector("goa-table-sort-header[name='created']").getAttribute('direction')).toBe('desc');
    expect(baseElement.querySelector("goa-table-sort-header[name='disposition']").getAttribute('direction')).toBe(
      'none',
    );
    expect(baseElement.querySelector("goa-table-sort-header[name='data.firstName']")).toBeTruthy();
  });

  it('should not make form data columns sortable when there are more results than can be sorted', () => {
    const state = createState();
    state.form.resultTotals.submissions = DATA_VALUE_SORT_MAX_RESULTS + 1;
    const { baseElement } = renderSubmissions(state);

    const sortable = Array.from(baseElement.querySelectorAll('goa-table-sort-header')).map((header) =>
      header.getAttribute('name'),
    );
    expect(sortable).toEqual(['created', 'disposition']);
  });

  it('should explain why form data columns cannot be sorted', () => {
    const state = createState();
    state.form.resultTotals.submissions = DATA_VALUE_SORT_MAX_RESULTS + 1;
    const { getByTestId } = renderSubmissions(state);

    expect(getByTestId(DATA_VALUE_SORT_NOTICE_ID).textContent).toContain(`${DATA_VALUE_SORT_MAX_RESULTS}`);
  });

  it('should not explain anything when form data columns can be sorted', () => {
    const { queryByTestId } = renderSubmissions();

    expect(queryByTestId(DATA_VALUE_SORT_NOTICE_ID)).toBeNull();
  });

  it('should point the unsortable headings at the explanation', () => {
    const state = createState();
    state.form.resultTotals.submissions = DATA_VALUE_SORT_MAX_RESULTS + 1;
    const { baseElement } = renderSubmissions(state);

    const heading = Array.from(baseElement.querySelectorAll('th')).find((th) => th.textContent === 'First name');
    expect(heading.getAttribute('aria-describedby')).toBe(DATA_VALUE_SORT_NOTICE_ID);
  });

  it('should not make the tags or actions columns sortable', () => {
    const { baseElement } = renderSubmissions();

    const sortable = Array.from(baseElement.querySelectorAll('goa-table-sort-header')).map((header) =>
      header.getAttribute('name'),
    );
    expect(sortable).toEqual(['created', 'disposition', 'data.firstName']);
  });

  it('should find submissions with the selected sort', () => {
    const { baseElement, store } = renderSubmissions();

    fireEvent(
      baseElement.querySelector('goa-table'),
      new CustomEvent('_sort', { detail: { sortBy: 'disposition', sortDir: 1 } }),
    );

    expect(store.getActions()).toContainEqual({
      type: 'form/setSubmissionSort',
      payload: { field: 'disposition', direction: 'asc' },
    });
    expect(findSubmissions).toHaveBeenCalledWith({
      definitionId,
      criteria: getDefaultSubmissionCriteria(),
      sort: { field: 'disposition', direction: 'asc' },
    });
  });

  it('should keep the sort when loading more submissions', () => {
    const { baseElement } = renderSubmissions();
    (findSubmissions as unknown as jest.Mock).mockClear();

    fireEvent(baseElement.querySelector("goa-button[testId='find-submissions']"), new CustomEvent('_click'));

    expect(findSubmissions).toHaveBeenCalledWith({
      definitionId,
      criteria: getDefaultSubmissionCriteria(),
      sort: getDefaultResultsSort(),
      after: undefined,
    });
  });

  it('should not find submissions again for the sort the results already have', () => {
    const { baseElement } = renderSubmissions();
    (findSubmissions as unknown as jest.Mock).mockClear();

    fireEvent(
      baseElement.querySelector('goa-table'),
      new CustomEvent('_sort', { detail: { sortBy: 'created', sortDir: -1 } }),
    );

    expect(findSubmissions).not.toHaveBeenCalled();
  });
});
