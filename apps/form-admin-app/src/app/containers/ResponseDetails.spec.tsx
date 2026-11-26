import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { ResponseDetails } from './ResponseDetails';
import { runFormOperation, selectForm, selectSubmission } from '../state';
import { FormStatus } from '../state/types';

jest.mock('../state', () => {
  const actual = jest.requireActual('../state');
  return {
    ...actual,
    selectForm: jest.fn((payload) => ({ type: 'form/select-form', payload })),
    selectSubmission: jest.fn((payload) => ({ type: 'form/select-submission', payload })),
    loadTopic: jest.fn((payload) => ({ type: 'comment/load-topic', payload })),
    selectTopic: jest.fn((payload) => ({ type: 'comment/select-topic', payload })),
    runFormOperation: jest.fn((payload) => ({ type: 'form/run-form-operation', payload })),
    tagResource: jest.fn((payload) => ({ type: 'directory/tag-resource', payload })),
  };
});

jest.mock('./FormViewer', () => ({ FormViewer: () => <div data-testid="form-viewer" /> }));
jest.mock('./ReviewWorkspace', () => ({ ReviewWorkspace: () => <div data-testid="review-workspace" /> }));
jest.mock('./PdfDownload', () => ({ PdfDownload: () => <div data-testid="pdf-download" /> }));

const mockStore = configureStore();
const definitionId = 'test';
const formId = 'form-1';
const formUrn = `urn:ads:platform:form-service:v1:/forms/${formId}`;

const submission = {
  urn: 'urn:ads:platform:form-service:v1:/submissions/submission-1',
  id: 'submission-1',
  formId,
  formDefinitionId: definitionId,
  formData: {},
  formFiles: {},
  created: '2026-08-01T12:00:00.000Z',
  createdBy: { id: 'user-1', name: 'Test User' },
  disposition: null,
  notes: [],
  updated: '2026-08-01T12:00:00.000Z',
  updatedBy: { id: 'user-1', name: 'Test User' },
  hash: 'hash',
};

const baseForm = {
  urn: formUrn,
  id: formId,
  formId,
  status: FormStatus.submitted,
  created: '2026-08-01T12:00:00.000Z',
  createdBy: { id: 'user-1', name: 'Ada Lovelace' },
  submitted: '2026-08-02T12:00:00.000Z',
  lastAccessed: '2026-08-02T12:00:00.000Z',
  applicant: { addressAs: 'Ada' },
  data: {},
  files: {},
  submission: { id: submission.id, urn: submission.urn },
  dryRun: false,
};

const createState = ({
  form = baseForm,
  selectedSubmission = submission.id,
  roles = ['urn:ads:platform:form-service:form-admin'],
}: { form?: unknown; selectedSubmission?: string; roles?: string[] } = {}) => ({
  user: { user: { id: 'user-1', name: 'Test User', email: 'test@gov.ab.ca', roles } },
  form: {
    busy: { initializing: false, loading: false, findPdf: false, executing: false, exporting: false },
    definitions: {
      [definitionId]: { id: definitionId, name: 'Test definition', anonymousApply: false, assessorRoles: [] },
    },
    forms: form ? { [formId]: form } : {},
    submissions: { [submission.id]: submission },
    pdfs: {},
    results: { definitions: [], forms: [formId] },
    selectedDefinition: definitionId,
    selectedForm: formId,
    selectedSubmission,
    dispositionDraft: { status: '', reason: '' },
    export: { forms: {} },
  },
  directory: {
    resourceTags: {},
    tagResources: {},
    results: [],
    next: null,
    busy: { loading: false, loadingResourceTags: {}, executing: false },
  },
  file: { files: {}, metadata: {}, busy: { download: {}, metadata: {}, find: false } },
  comment: { topics: {} },
});

const renderDetails = (state = createState()) => {
  const store = mockStore(state);
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/responses/${formId}`]}>
        <Routes>
          <Route path="/responses/:formId" element={<ResponseDetails />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

  return { store, ...view };
};

const buttonWithText = (baseElement: Element, text: string) =>
  Array.from(baseElement.querySelectorAll('goa-button')).find((button) => button.textContent.trim() === text);

// The archive confirmation modal renders its own buttons regardless of whether it is open, so the
// form operations are read from the actions form rather than the whole page.
const formOperations = (baseElement: Element) =>
  Array.from(baseElement.querySelector('form')?.querySelectorAll('goa-button') || []).map((button) =>
    button.textContent.trim(),
  );

describe('ResponseDetails', () => {
  beforeEach(() => {
    (selectForm as unknown as jest.Mock).mockClear();
    (selectSubmission as unknown as jest.Mock).mockClear();
    (runFormOperation as unknown as jest.Mock).mockClear();
  });

  it('should select the form of the response route', () => {
    renderDetails();

    expect(selectForm).toHaveBeenCalledWith(formId);
  });

  it('should select the submission record of the response', () => {
    renderDetails();

    expect(selectSubmission).toHaveBeenCalledWith(submission.id);
  });

  it('should not select a submission for a response without a submission record', () => {
    const { submission: _omitted, ...formWithoutSubmission } = baseForm;
    renderDetails(createState({ form: formWithoutSubmission, selectedSubmission: null }));

    expect(selectSubmission).not.toHaveBeenCalled();
  });

  it('should show the properties of the response in the header', () => {
    const { baseElement } = renderDetails();

    expect(baseElement.textContent).toContain('Ada Lovelace');
    expect(baseElement.textContent).toContain('Aug 1, 2026');
    expect(baseElement.textContent).toContain('Aug 2, 2026');
  });

  it('should show the form and the review workspace together', () => {
    const { getByTestId } = renderDetails();

    expect(getByTestId('form-viewer')).toBeTruthy();
    expect(getByTestId('review-workspace')).toBeTruthy();
  });

  it('should hide the review workspace when the workspace is toggled off', () => {
    const { baseElement, queryByTestId } = renderDetails();

    fireEvent(buttonWithText(baseElement, 'Hide workspace'), new CustomEvent('_click'));

    expect(queryByTestId('review-workspace')).toBeNull();
    expect(buttonWithText(baseElement, 'Show workspace')).toBeTruthy();
  });

  it('should offer the form operations of a submitted response to a form admin', () => {
    const { baseElement } = renderDetails();

    expect(formOperations(baseElement)).toEqual(['Set to draft', 'Archive form']);
  });

  it('should set a submitted response back to draft', () => {
    const { baseElement } = renderDetails();

    fireEvent(buttonWithText(baseElement, 'Set to draft'), new CustomEvent('_click'));

    expect(runFormOperation).toHaveBeenCalledWith(expect.objectContaining({ operation: 'to-draft' }));
  });

  it('should not offer the form operations to a user without the roles for them', () => {
    const { baseElement } = renderDetails(createState({ roles: [] }));

    expect(formOperations(baseElement)).toEqual([]);
  });
});
