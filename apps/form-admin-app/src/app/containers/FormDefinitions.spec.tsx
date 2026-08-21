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
}: {
  definitionResults?: string[];
  totalDefinitions?: number | null;
  definitionCriteria?: Record<string, unknown>;
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
      definitions: null,
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

  it('should clear the filters from the header summary', () => {
    const { baseElement } = renderDefinitions(createState({ definitionCriteria: { tag: 'urgent' } }));
    (loadDefinitions as unknown as jest.Mock).mockClear();

    fireEvent(baseElement.querySelector('form goa-button'), new CustomEvent('_click'));

    expect(loadDefinitions).toHaveBeenCalledWith({ criteria: {} });
  });
});
