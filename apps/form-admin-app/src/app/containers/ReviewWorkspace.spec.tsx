import { fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ReviewWorkspace } from './ReviewWorkspace';
import { updateFormDisposition } from '../state';

jest.mock('../state', () => {
  const actual = jest.requireActual('../state');
  return {
    ...actual,
    updateFormDisposition: jest.fn((payload) => ({ type: 'form/update-form-disposition', payload })),
  };
});

const mockStore = configureStore();

const busy = { initializing: false, loading: false, findPdf: false, executing: false, exporting: false };

const definition = {
  id: 'test',
  name: 'Test definition',
  supportTopic: true,
  dispositionStates: [{ id: 'rejected', name: 'rejected', description: 'Rejected' }],
};

const submission = {
  urn: 'urn:ads:platform:form-service:v1:/submissions/submission-1',
  id: 'submission-1',
  formId: 'form-1',
  formDefinitionId: 'test',
  formData: {},
  formFiles: {},
  created: '2026-08-01T12:00:00.000Z',
  createdBy: { id: 'user-1', name: 'Test User' },
  disposition: null,
  notes: [
    {
      id: 'note-1',
      content: 'Called the applicant.',
      created: '2026-08-02T12:00:00.000Z',
      createdBy: { id: 'reviewer-1', name: 'Reviewer One' },
    },
  ],
  updated: '2026-08-01T12:00:00.000Z',
  updatedBy: { id: 'user-1', name: 'Test User' },
  hash: 'hash',
};

const form = {
  id: 'form-1',
  urn: 'urn:ads:platform:form-service:v1:/forms/form-1',
  definitionId: 'test',
};

const renderWorkspace = (props = {}) => {
  const store = mockStore({
    form: {
      forms: { [form.id]: form },
      selectedForm: form.id,
      results: { forms: [form.id] },
    },
    comment: {
      topics: {},
      selected: { resourceId: null, canRead: false, canComment: false },
      comments: { results: [], next: null },
      draft: { title: null, content: null },
      busy: { loading: false, executing: false },
    },
    user: {
      user: { id: 'user-1', name: 'Test User', email: 'test@gov.ab.ca', roles: [] },
    },
    directory: {
      resourceTags: {},
      tagResources: {},
      results: [],
      next: null,
      busy: { loading: false, loadingResourceTags: {}, executing: false },
    },
  });
  const dispatch = jest.fn().mockResolvedValue({ type: 'form/update-form-disposition/fulfilled' });
  const view = render(
    <Provider store={store}>
      <ReviewWorkspace
        dispatch={dispatch as never}
        definition={definition as never}
        form={form as never}
        submission={submission as never}
        draft={{ status: 'rejected', reason: 'invalid data' }}
        busy={busy}
        onOpenTag={jest.fn()}
        {...props}
      />
    </Provider>,
  );

  return { dispatch, ...view };
};

describe('ReviewWorkspace', () => {
  beforeEach(() => {
    (updateFormDisposition as unknown as jest.Mock).mockClear();
  });

  it('should render the workspace sections', () => {
    const { baseElement } = renderWorkspace();

    const headings = Array.from(baseElement.querySelectorAll('goa-accordion')).map((accordion) =>
      accordion.getAttribute('heading'),
    );
    expect(headings).toEqual(['Messages', 'Notes', 'Tags', 'History', 'Disposition']);
  });

  it('should omit the submission record sections for a response without a submission', () => {
    const { baseElement } = renderWorkspace({ submission: null });

    const headings = Array.from(baseElement.querySelectorAll('goa-accordion')).map((accordion) =>
      accordion.getAttribute('heading'),
    );
    expect(headings).toEqual(['Messages', 'Tags', 'History']);
  });

  it('should render the notes of the submission in the notes section', () => {
    const { baseElement } = renderWorkspace();

    const notes = baseElement.querySelector("goa-accordion[heading='Notes']");
    expect(notes.textContent).toContain('Called the applicant.');
    expect(notes.textContent).toContain('Reviewer One');
  });

  it('should disposition the submission from the draft', () => {
    const { baseElement } = renderWorkspace();

    fireEvent(baseElement.querySelector("goa-accordion[heading='Disposition'] goa-button"), new CustomEvent('_click'));

    expect(updateFormDisposition).toHaveBeenCalledWith({
      submissionUrn: '/forms/form-1/submissions/submission-1',
      status: 'rejected',
      reason: 'invalid data',
    });
  });

  it('should show the disposition of a dispositioned submission', () => {
    const { baseElement } = renderWorkspace({
      submission: {
        ...submission,
        disposition: { id: 'disposition-1', status: 'rejected', reason: 'invalid data', date: '2026-08-04T12:00:00Z' },
      },
    });

    const disposition = baseElement.querySelector("goa-accordion[heading='Disposition']");
    expect(disposition.textContent).toContain('invalid data');
    expect(disposition.querySelector('goa-dropdown')).toBeFalsy();
  });
});
