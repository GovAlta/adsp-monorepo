import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { Responses } from './Responses';
import { findForms, getDefaultFormCriteria, getDefaultResultsSort } from '../state';
import { FormStatus } from '../state/types';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

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
  formSort = getDefaultResultsSort(),
  roles = ['urn:ads:platform:form-service:form-admin'],
}: {
  forms?: Record<string, unknown>;
  formResults?: string[];
  formCriteria?: ReturnType<typeof getDefaultFormCriteria>;
  formSort?: ReturnType<typeof getDefaultResultsSort>;
  roles?: string[];
} = {}) => ({
  user: {
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@gov.ab.ca',
      roles,
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
        dataSchema: {
          type: 'object',
          properties: {
            firstName: { type: 'string', title: 'First name' },
            lastName: { type: 'string', title: 'Last name' },
          },
        },
        reviewConfiguration: { columns: [{ path: 'firstName' }] },
      },
    },
    pdfs: {},
    results: {
      definitions: [],
      forms: formResults,
    },
    resultTotals: {
      definitions: 0,
      forms: formResults.length,
    },
    definitionCriteria: {},
    formCriteria,
    formSort,
    next: {
      definitions: null,
      forms: null,
    },
    selectedDefinition: definitionId,
    selectedForm: null,
    selectedSubmission: null,
    dispositionDraft: { status: '', reason: '' },
    export: {
      forms: {},
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

const renderResponses = (state = createState()) => {
  const store = mockStore(state);
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <Responses definitionId={definitionId} />
      </MemoryRouter>
    </Provider>,
  );

  return { store, ...view };
};

describe('Responses', () => {
  beforeEach(() => {
    (findForms as unknown as jest.Mock).mockClear();
    mockNavigate.mockClear();
  });

  it('should render the responses table and filters trigger', () => {
    const { baseElement, getByText } = renderResponses(
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
    expect(baseElement.querySelector("goa-button[testId='export-responses']")).toBeTruthy();
  });

  it('should not render form data that is not in the review configuration', () => {
    const { queryByText } = renderResponses(
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
            data: { firstName: 'Ada', lastName: 'Lovelace' },
          },
        },
        formResults: ['form-1'],
      }),
    );

    expect(queryByText('Lovelace')).toBeNull();
  });

  it('should dispatch findForms on mount when no forms are loaded', () => {
    renderResponses();

    expect(findForms).toHaveBeenCalledWith({
      definitionId,
      criteria: getDefaultFormCriteria(),
      sort: getDefaultResultsSort(),
    });
  });

  it('should show the active filter badge for default form criteria', () => {
    const { baseElement } = renderResponses();

    expect(baseElement.querySelector("goa-badge[testId='active-filter-count']").getAttribute('content')).toBe(
      '2 active',
    );
  });

  it('should keep filter controls mounted and find responses from the drawer', () => {
    const { baseElement } = renderResponses();

    expect(baseElement.querySelector("goa-dropdown[name='form-status']")).toBeTruthy();

    fireEvent(baseElement.querySelector("goa-button[testId='find-responses']"), new CustomEvent('_click'));

    expect(findForms).toHaveBeenCalledWith({
      definitionId,
      criteria: getDefaultFormCriteria(),
      sort: getDefaultResultsSort(),
      after: undefined,
    });
  });

  it('should not offer the status filter to a user who is not a form admin', () => {
    const { baseElement } = renderResponses(createState({ roles: ['test-assessor'] }));

    expect(baseElement.querySelector("goa-dropdown[name='form-status']")).toBeFalsy();
    expect(baseElement.querySelector("goa-button[testId='find-responses']")).toBeTruthy();
  });

  it('should indicate the created on column is sorted descending by default', () => {
    const { baseElement } = renderResponses();

    expect(baseElement.querySelector("goa-table-sort-header[name='created']").getAttribute('direction')).toBe('desc');
    expect(baseElement.querySelector("goa-table-sort-header[name='status']").getAttribute('direction')).toBe('none');
    expect(baseElement.querySelector("goa-table-sort-header[name='data.firstName']")).toBeTruthy();
  });

  it('should find forms with the selected sort', () => {
    const { baseElement, store } = renderResponses();

    fireEvent(
      baseElement.querySelector('goa-table'),
      new CustomEvent('_sort', { detail: { sortBy: 'status', sortDir: 1 } }),
    );

    expect(store.getActions()).toContainEqual({
      type: 'form/setFormSort',
      payload: { field: 'status', direction: 'asc' },
    });
    expect(findForms).toHaveBeenCalledWith({
      definitionId,
      criteria: getDefaultFormCriteria(),
      sort: { field: 'status', direction: 'asc' },
    });
  });

  it('should not find forms again for the sort the results already have', () => {
    const { baseElement } = renderResponses();
    (findForms as unknown as jest.Mock).mockClear();

    fireEvent(
      baseElement.querySelector('goa-table'),
      new CustomEvent('_sort', { detail: { sortBy: 'created', sortDir: -1 } }),
    );

    expect(findForms).not.toHaveBeenCalled();
  });

  it('should hide the filters trigger while the drawer is open', () => {
    const { baseElement } = renderResponses();

    fireEvent(baseElement.querySelector("goa-button[testId='show-filters']"), new CustomEvent('_click'));

    expect(baseElement.querySelector("goa-push-drawer[testid='filter-drawer']").getAttribute('open')).toBe('true');
    expect(baseElement.querySelector("goa-button[testId='show-filters']")).toBeFalsy();
  });
  const stateWithForm = () =>
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
    });

  it('should open the response when its row is selected', () => {
    const { getByText } = renderResponses(stateWithForm());

    fireEvent.click(getByText('Ada').closest('tr'));

    expect(mockNavigate).toHaveBeenCalledWith('form-1');
  });

  it('should open the response when its row is selected from the keyboard', () => {
    const { getByText } = renderResponses(stateWithForm());

    fireEvent.keyDown(getByText('Ada').closest('tr'), { key: 'Enter' });

    expect(mockNavigate).toHaveBeenCalledWith('form-1');
  });

  it('should not open the response when a control in the row is used', () => {
    const { baseElement } = renderResponses(stateWithForm());

    fireEvent.click(baseElement.querySelector('goa-icon-button'));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should no longer offer a separate actions column', () => {
    const { queryByText } = renderResponses(stateWithForm());

    expect(queryByText('Actions')).toBeNull();
  });
  it('should not shade the data value columns differently from the rest of the row', () => {
    const { getByText } = renderResponses(stateWithForm());

    const dataValue = getByText('Ada');
    // The leading cell carries no styling of its own, so it stands for the rest of the row.
    const plainCell = dataValue.closest('tr').querySelector('td');

    expect(getComputedStyle(dataValue).background).toBe(getComputedStyle(plainCell).background);
  });
});
