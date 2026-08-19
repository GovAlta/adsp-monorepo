import { act, fireEvent, render } from '@testing-library/react';
import { SubmissionNotes } from './SubmissionNotes';
import { addSubmissionNote, deleteSubmissionNote } from '../state';

jest.mock('../state', () => {
  const actual = jest.requireActual('../state');
  return {
    ...actual,
    addSubmissionNote: Object.assign(
      jest.fn((payload) => ({ type: 'form/add-submission-note', payload })),
      { fulfilled: { type: 'form/add-submission-note/fulfilled' } },
    ),
    deleteSubmissionNote: Object.assign(
      jest.fn((payload) => ({ type: 'form/delete-submission-note', payload })),
      { fulfilled: { type: 'form/delete-submission-note/fulfilled' } },
    ),
  };
});

const busy = { initializing: false, loading: false, findPdf: false, executing: false, exporting: false };

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
  updated: '2026-08-01T12:00:00.000Z',
  updatedBy: { id: 'user-1', name: 'Test User' },
  hash: 'hash',
  notes: [
    {
      id: 'note-1',
      content: 'Called the applicant.',
      created: '2026-08-02T12:00:00.000Z',
      createdBy: { id: 'reviewer-1', name: 'Reviewer One' },
    },
    {
      id: 'note-2',
      content: 'Waiting on documents.',
      created: '2026-08-03T12:00:00.000Z',
      createdBy: { id: 'reviewer-2', name: 'Reviewer Two' },
    },
  ],
};

const renderNotes = (props = {}) => {
  const dispatch = jest.fn().mockResolvedValue({ type: 'form/add-submission-note/fulfilled' });
  const view = render(
    <SubmissionNotes dispatch={dispatch as never} submission={submission as never} busy={busy} {...props} />,
  );

  return { dispatch, ...view };
};

describe('SubmissionNotes', () => {
  beforeEach(() => {
    (addSubmissionNote as unknown as jest.Mock).mockClear();
    (deleteSubmissionNote as unknown as jest.Mock).mockClear();
  });

  it('should render the notes of the submission with the most recent first', () => {
    const { baseElement, getByText } = renderNotes();

    expect(getByText('Called the applicant.')).toBeTruthy();
    expect(getByText('Waiting on documents.')).toBeTruthy();

    const notes = baseElement.querySelectorAll('.note');
    expect(notes[0].getAttribute('data-testid')).toBe('note-note-2');
    expect(notes[1].getAttribute('data-testid')).toBe('note-note-1');
  });

  it('should add the note that was written', async () => {
    const { baseElement, dispatch } = renderNotes();

    const textArea = baseElement.querySelector("goa-textarea[name='note']");
    fireEvent(textArea, new CustomEvent('_change', { detail: { name: 'note', value: 'Sent follow up email.' } }));
    await act(async () => {
      fireEvent(baseElement.querySelector("goa-button[testId='add-note']"), new CustomEvent('_click'));
    });

    expect(addSubmissionNote).toHaveBeenCalledWith({
      formId: 'form-1',
      submissionId: 'submission-1',
      content: 'Sent follow up email.',
    });
    expect(dispatch).toHaveBeenCalled();
  });

  it('should not allow adding a note without content', () => {
    const { baseElement } = renderNotes();

    const addButton = baseElement.querySelector("goa-button[testId='add-note']");
    expect(addButton.getAttribute('disabled')).toBe('true');

    fireEvent(
      baseElement.querySelector("goa-textarea[name='note']"),
      new CustomEvent('_change', { detail: { name: 'note', value: 'Sent follow up email.' } }),
    );

    expect(addButton.getAttribute('disabled')).toBeNull();
  });

  it('should delete the note that was confirmed', async () => {
    const { baseElement } = renderNotes();

    fireEvent(baseElement.querySelector("goa-icon-button[title='delete note']"), new CustomEvent('_click'));
    expect(baseElement.querySelector('goa-modal').getAttribute('open')).toBeTruthy();

    const [, confirm] = Array.from(baseElement.querySelectorAll('goa-modal goa-button'));
    await act(async () => {
      fireEvent(confirm, new CustomEvent('_click'));
    });

    expect(deleteSubmissionNote).toHaveBeenCalledWith({
      formId: 'form-1',
      submissionId: 'submission-1',
      // The most recent note is shown first, so its delete button is the first one.
      noteId: 'note-2',
    });
  });
});
