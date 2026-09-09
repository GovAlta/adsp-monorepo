import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { FormsDefinitions } from './FormDefinitions';
import { loadDefinitions } from '../state';

jest.mock('../state', () => {
  const actual = jest.requireActual('../state');
  return {
    ...actual,
    loadDefinitions: jest.fn((payload) => ({ type: 'form/load-definitions', payload })),
    getTags: jest.fn((payload) => ({ type: 'directory/get-tags', payload })),
    getResourceTags: jest.fn((payload) => ({ type: 'directory/get-resource-tags', payload })),
    tagResource: jest.fn((payload) => ({ type: 'directory/tag-resource', payload })),
  };
});

const mockStore = configureStore();
const definitionId = 'intake-form';
const definitionUrn = 'urn:ads:platform:configuration-service:v2:/configuration/form-service/intake-form';

const createState = ({
  definitionResults = [definitionId],
  totalDefinitions = 12,
  definitionCriteria = {},
  searching = false,
  loading = false,
  next = null,
}: {
  definitionResults?: string[];
  totalDefinitions?: number | null;
  definitionCriteria?: Record<string, unknown>;
  searching?: boolean;
  loading?: boolean;
  next?: string | null;
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
      loading,
      searching,
      findPdf: false,
      executing: false,
      exporting: false,
    },
    forms: {},
    submissions: {},
    definitions: {
      [definitionId]: {
        id: definitionId,
        name: 'Intake form',
        urn: definitionUrn,
        anonymousApply: false,
        oneFormPerApplicant: true,
      },
    },
    pdfs: {},
    dataValues: {},
    results: {
      definitions: definitionResults,
      forms: [],
      submissions: [],
    },
    resultTotals: {
      definitions: totalDefinitions,
      forms: 0,
      submissions: 0,
    },
    definitionCriteria,
    formCriteria: {},
    submissionCriteria: {},
    next: {
      definitions: next,
      forms: null,
      submissions: null,
    },
    selectedDefinition: null,
    selectedForm: null,
    selectedSubmission: null,
    dispositionDraft: { status: '', reason: '' },
    export: { forms: {}, submissions: {} },
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
});

const renderDefinitions = (state = createState()) => {
  const store = mockStore(state);
  const view = render(
    <Provider store={store}>
      <MemoryRouter>
        <FormsDefinitions />
      </MemoryRouter>
    </Provider>,
  );

  return { store, ...view };
};

const SUMMARY_TEXT = 'matching your current filters';

describe('FormsDefinitions', () => {
  beforeEach(() => {
    (loadDefinitions as unknown as jest.Mock).mockClear();
  });

  it('should show the results summary in the sticky header instead of the scrolling content', () => {
    const { container } = renderDefinitions();

    const searchForm = container.querySelector('form');
    expect(searchForm.textContent).toContain(SUMMARY_TEXT);
    expect(searchForm.textContent).toContain('Showing 1 of 12');

    const content = container.querySelector('goa-table').parentElement;
    expect(content.textContent).not.toContain(SUMMARY_TEXT);
  });

  it('should show the search action as an icon button beside the tag filter', () => {
    const { baseElement } = renderDefinitions();

    const action = baseElement.querySelector("goa-icon-button[testId='load-definitions']");
    expect(action).toBeTruthy();
    expect(action.getAttribute('icon')).toBe('search');
    expect(action.getAttribute('arialabel')).toBe('Load definitions');
  });

  it('should no longer show the load definitions text button', () => {
    const { queryByText } = renderDefinitions();

    expect(queryByText('Load definitions')).toBeNull();
  });

  it('should load definitions when the search action is clicked', () => {
    const criteria = { tag: 'urgent' };
    const { baseElement } = renderDefinitions(createState({ definitionCriteria: criteria }));
    (loadDefinitions as unknown as jest.Mock).mockClear();

    fireEvent(baseElement.querySelector("goa-icon-button[testId='load-definitions']"), new CustomEvent('_click'));

    expect(loadDefinitions).toHaveBeenCalledWith({ after: undefined, tag: 'urgent', criteria });
  });

  // The search replaces the whole listing, so leaving the previous results up with one skeleton row
  // appended below them put the only feedback at the bottom of the list, out of sight.
  it('should show a loading state in place of the results while searching', () => {
    const { baseElement, queryByText } = renderDefinitions(createState({ searching: true, loading: true }));

    expect(queryByText('Intake form')).toBeNull();
    expect(baseElement.querySelectorAll('goa-skeleton').length).toBeGreaterThan(1);
  });

  it('should disable the tag filter while searching, so the filter shown is the one applied', () => {
    const { baseElement } = renderDefinitions(createState({ searching: true, loading: true }));

    expect(baseElement.querySelector("goa-dropdown[name='tag']").getAttribute('disabled')).toBe('true');
  });

  it('should leave the tag filter usable when not searching', () => {
    const { baseElement } = renderDefinitions();

    expect(baseElement.querySelector("goa-dropdown[name='tag']").getAttribute('disabled')).toBeFalsy();
  });

  // Paging keeps the results on screen, so that load keeps the trailing skeleton instead.
  it('should keep the results and trail a skeleton while paging further into them', () => {
    const { baseElement, queryByText } = renderDefinitions(
      createState({ loading: true, searching: false, next: 'cursor' }),
    );

    expect(queryByText('Intake form')).toBeTruthy();
    expect(baseElement.querySelectorAll('goa-skeleton').length).toBe(4);
  });

  it('should clear the filters from the header summary', () => {
    const { baseElement } = renderDefinitions(createState({ definitionCriteria: { tag: 'urgent' } }));
    (loadDefinitions as unknown as jest.Mock).mockClear();

    fireEvent(baseElement.querySelector('form goa-button'), new CustomEvent('_click'));

    expect(loadDefinitions).toHaveBeenCalledWith({ criteria: {} });
  });
});
