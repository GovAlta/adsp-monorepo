import {
  GoabButton,
  GoabButtonGroup,
  GoabCircularProgress,
  GoabFormItem,
  GoabIconButton,
  GoabModal,
  GoabTextArea,
} from '@abgov/react-components';
import moment from 'moment';
import { FunctionComponent, useState } from 'react';
import styled from 'styled-components';
import { GoabTextAreaOnChangeDetail } from '@abgov/ui-components-common';
interface Comment {
  id: number;
  byCurrentUser: boolean;
  createdBy: {
    id: string;
    name: string;
  };
  createdOn: Date;
  title?: string;
  content: string;
}

interface DraftComment {
  title?: string;
  content: string;
}

interface CommentsViewerProps {
  className?: string;
  heading?: string;
  addCommentLabel?: string;
  anonymousName?: string;
  userId: string;
  canComment: boolean;
  canLoadMore: boolean;
  topicId: number | null;
  comments: Comment[];
  draft: DraftComment;
  loading: boolean;
  busy: boolean;
  commenting: boolean;
  onLoadMore: () => void;
  onUpdateDraft: (draft: DraftComment) => void;
  onAddComment: (draft: DraftComment) => void;
  onDeleteComment: (topicId: number, commentId: number) => void;
}

function formatTimestamp(timestamp: Date): string {
  const now = moment();
  const value = moment(timestamp);
  // Don't include the year if the timestamp is for the current year.
  const year = value?.year() === now.year() ? '' : ' YYYY';
  // Show day of the week if in the current week.
  const day = value?.week() === now.week() ? 'dddd' : 'MMMM D';
  return value?.format(`${day}${year}, h:mm a`);
}

const CommentsViewerComponent: FunctionComponent<CommentsViewerProps> = ({
  className,
  heading,
  addCommentLabel,
  anonymousName,
  canComment,
  canLoadMore,
  topicId,
  draft,
  userId,
  comments,
  loading,
  busy,
  commenting,
  onLoadMore,
  onUpdateDraft,
  onAddComment,
  onDeleteComment,
}) => {
  heading = heading || 'Comments';
  addCommentLabel = addCommentLabel || 'Add comment';
  anonymousName = anonymousName || 'Commenter';
  const [deleting, setDeleting] = useState<Comment>(null);

  return (
    <div className={className}>
      <h3>{heading}</h3>
      <div className="comments">
        {comments.map((result) => (
          <div key={result.id} className="comment" data-user-comment={result.byCurrentUser}>
            <div>
              <span>{result.createdBy.name || anonymousName} </span>
              <span>{formatTimestamp(result.createdOn)}</span>
              {/* Only allow the user that created the message to be able to delete it */}
              {userId === result.createdBy.id && (
                <span>
                  <GoabIconButton
                    title="remove message"
                    icon="trash-bin:outline"
                    variant="color"
                    size="small"
                    onClick={() => {
                      setDeleting(result);
                    }}
                  />
                </span>
              )}
            </div>
            <div>
              <p>{result.content}</p>
            </div>
          </div>
        ))}
        <GoabCircularProgress variant="inline" size="small" visible={loading} />
        {!loading && canLoadMore && (
          <GoabButton size="compact" type="text" onClick={onLoadMore}>
            Load more
          </GoabButton>
        )}
      </div>
      <form>
        <GoabFormItem label={addCommentLabel}>
          <GoabTextArea
            name="comment"
            value={draft.content || ''}
            disabled={!canComment}
            onChange={(detail: GoabTextAreaOnChangeDetail) =>
              onUpdateDraft({ title: draft.title, content: detail.value })
            }
            placeholder={'Write your comment...'}
            width="100%"
          />
        </GoabFormItem>
        <GoabButtonGroup alignment="start" mt="l">
          <GoabButton
            size="compact"
            type="secondary"
            disabled={!draft.content}
            onClick={() => onUpdateDraft({ title: draft.title, content: null })}
          >
            Clear
          </GoabButton>
          <GoabButton
            size="compact"
            type="primary"
            disabled={!draft.content || commenting}
            onClick={() => onAddComment(draft)}
          >
            {addCommentLabel}
          </GoabButton>
        </GoabButtonGroup>
      </form>
      <GoabModal heading="Are you sure you want to delete this message?" open={!!deleting}>
        <div>This action cannot be undone.</div>
        <GoabButtonGroup alignment="end" mt="xl">
          <GoabButton size="compact" type="secondary" onClick={() => setDeleting(null)}>
            Cancel
          </GoabButton>
          <GoabButton
            size="compact"
            type="primary"
            variant="destructive"
            disabled={busy}
            onClick={async () => {
              await onDeleteComment(topicId, deleting.id);
              setDeleting(null);
            }}
          >
            Delete
          </GoabButton>
        </GoabButtonGroup>
      </GoabModal>
    </div>
  );
};

export const CommentsViewer = styled(CommentsViewerComponent)`
  display: flex;
  flex-direction: column;
  padding-bottom: var(--goa-space-l);
  & > h3 {
    text-transform: capitalize;
    padding-left: var(--goa-space-l);
    padding-right: var(--goa-space-l);
    padding-bottom: var(--goa-space-s);
  }
  & > form {
    background: var(--goa-color-greyscale-100);
    flex-shrink: 0;
    flex-grow: 0;
    max-height: 40vh;
    padding: var(--goa-space-l);
    padding-top: var(--goa-space-s);
  }
  & > .comments {
    height: 250px;
    overflow-y: scroll;
    flex-direction: column-reverse;
    padding-left: var(--goa-space-l);
    padding-right: var(--goa-space-l);
    margin-bottom: var(--goa-space-l);

    > .comment {
      margin: var(--goa-space-s);
      margin-bottom: var(--goa-space-l);

      span:first-child {
        font-weight: bold;
        padding-right: var(--goa-space-s);
      }

      span:last-child {
        font-size: var(--goa-font-size-2);
        font-weight: var(--goa-font-weight-regular);
        line-height: var(--goa-line-height-2);
        letter-spacing: 0em;
        text-align: left;
        color: var(--goa-color-text-disabled);
        margin-left: var(--goa-space-m);
      }

      div {
        display: flex;
        p {
          margin-top: var(--goa-space-2xs);
          margin-right: auto;
          padding-right: var(--goa-space-2xl);
          font-size: 16px;
          font-weight: 400;
          line-height: 24px;
          color: rgb(51, 51, 51);
          letter-spacing: 0em;
          text-align: left;
          text-wrap: wrap;
        }
      }
    }
    > .comment[data-user-comment='true'] {
      div {
        > :first-child {
          margin-left: auto;
          margin-right: 0;
        }
      }
      p {
        padding-left: var(--goa-space-2xl);
        padding-right: 0;
      }
    }
    & > * {
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
  }
`;

export default CommentsViewer;
