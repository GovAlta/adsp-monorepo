import {
  GoabButton,
  GoabButtonGroup,
  GoabFormItem,
  GoabIconButton,
  GoabModal,
  GoabTextArea,
} from '@abgov/react-components';
import { GoabTextAreaOnChangeDetail } from '@abgov/ui-components-common';
import { DateTime } from 'luxon';
import { FunctionComponent, useState } from 'react';
import styled from 'styled-components';
import {
  addSubmissionNote,
  AppDispatch,
  deleteSubmissionNote,
  formBusySelector,
  FormSubmissionNote,
  submissionSelector,
} from '../state';

const MAX_NOTE_LENGTH = 5000;

const NotesList = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: var(--goa-space-l);

  > .note {
    border-bottom: 1px solid var(--goa-color-greyscale-200);
    padding-bottom: var(--goa-space-s);
    margin-bottom: var(--goa-space-s);

    > .note-header {
      display: flex;
      align-items: center;

      > .note-author {
        font-weight: var(--goa-font-weight-bold);
      }

      > .note-created {
        color: var(--goa-color-text-secondary);
        font-size: var(--goa-font-size-2);
        margin-left: var(--goa-space-s);
        margin-right: auto;
      }
    }

    > .note-content {
      margin: var(--goa-space-2xs) 0 0 0;
      white-space: pre-wrap;
    }
  }
`;

interface SubmissionNotesProps {
  dispatch: AppDispatch;
  submission: ReturnType<typeof submissionSelector>['submission'];
  busy: ReturnType<typeof formBusySelector>;
}

export const SubmissionNotes: FunctionComponent<SubmissionNotesProps> = ({ dispatch, submission, busy }) => {
  const [draft, setDraft] = useState('');
  const [deleting, setDeleting] = useState<FormSubmissionNote>(null);

  // Show the most recent note first since that's where reviewers pick up from.
  const notes = [...(submission?.notes || [])].sort((a, b) => b.created.localeCompare(a.created));
  const content = draft.trim();
  const error = content.length > MAX_NOTE_LENGTH ? `Note must be ${MAX_NOTE_LENGTH} characters or less.` : '';

  return (
    <>
      {notes.length > 0 && (
        <NotesList>
          {notes.map((note) => (
            <div key={note.id} className="note" data-testid={`note-${note.id}`}>
              <div className="note-header">
                <span className="note-author">{note.createdBy.name}</span>
                <span className="note-created">{DateTime.fromISO(note.created).toFormat('LLL d, yyyy h:mm a')}</span>
                <GoabIconButton
                  title="delete note"
                  icon="trash"
                  size="small"
                  variant="color"
                  disabled={busy.executing}
                  onClick={() => setDeleting(note)}
                />
              </div>
              <p className="note-content">{note.content}</p>
            </div>
          ))}
        </NotesList>
      )}
      <GoabFormItem label="Note" error={error}>
        <GoabTextArea
          name="note"
          value={draft}
          placeholder="Write a note about this submission..."
          width="100%"
          error={!!error}
          onChange={(detail: GoabTextAreaOnChangeDetail) => setDraft(detail.value)}
          mb="m"
        />
      </GoabFormItem>
      <GoabButtonGroup alignment="start">
        <GoabButton
          testId="add-note"
          size="compact"
          disabled={!content || !!error || busy.executing}
          onClick={async () => {
            const { type } = await dispatch(
              addSubmissionNote({ formId: submission.formId, submissionId: submission.id, content }),
            );

            // Only clear the draft if the note was actually added, so the reviewer doesn't lose it on failure.
            if (type === addSubmissionNote.fulfilled.type) {
              setDraft('');
            }
          }}
        >
          Add note
        </GoabButton>
      </GoabButtonGroup>
      <GoabModal heading="Delete note" open={!!deleting}>
        <div>Delete the note added by {deleting?.createdBy?.name}? This action cannot be undone.</div>
        <GoabButtonGroup alignment="end" mt="xl">
          <GoabButton size="compact" type="secondary" onClick={() => setDeleting(null)}>
            Cancel
          </GoabButton>
          <GoabButton
            size="compact"
            type="primary"
            disabled={busy.executing}
            onClick={async () => {
              await dispatch(
                deleteSubmissionNote({
                  formId: submission.formId,
                  submissionId: submission.id,
                  noteId: deleting.id,
                }),
              );
              setDeleting(null);
            }}
          >
            Delete note
          </GoabButton>
        </GoabButtonGroup>
      </GoabModal>
    </>
  );
};
