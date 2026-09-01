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
import styled, { css } from 'styled-components';
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
  userId?: string;
  canComment: boolean;
  canLoadMore: boolean;
  // Renders the conversation as a two-participant message thread rather than a flat comment list.
  messaging?: boolean;
  topicId?: number | null;
  comments: Comment[];
  draft: DraftComment;
  loading: boolean;
  busy?: boolean;
  commenting: boolean;
  onLoadMore: () => void;
  onUpdateDraft: (draft: DraftComment) => void;
  onAddComment: (draft: DraftComment) => void;
  onDeleteComment?: (topicId: number, commentId: number) => void;
}

function formatTimestamp(timestamp: Date): string {
  const now = moment();
  const value = moment(timestamp);
  // Today carries no day at all, the way a text message thread shows only a time; naming the
  // weekday reads as some other Tuesday when it is in fact the last hour.
  if (value.isSame(now, 'day')) {
    return value.format('h:mm a');
  }
  // Don't include the year if the timestamp is for the current year.
  const sameYear = value.year() === now.year();
  const year = sameYear ? '' : ' YYYY';
  // Show day of the week if in the current week. Week numbers repeat every year, so the year has
  // to match too, or a message from a year ago reads as one from this week.
  const day = sameYear && value.week() === now.week() ? 'dddd' : 'MMMM D';
  return value.format(`${day}${year}, h:mm a`);
}

const CommentsViewerComponent: FunctionComponent<CommentsViewerProps> = ({
  className,
  heading,
  addCommentLabel,
  anonymousName,
  canComment,
  canLoadMore,
  messaging,
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
      {/* A caller that wants no heading passes a blank one; don't reserve space for it. */}
      {heading.trim() && <h3>{heading}</h3>}
      <div className="comments">
        {comments.map((result, index) => {
          // In a message thread a run of messages from the same person carries one byline,
          // the way a phone's messaging app groups them.
          const previous = comments[index - 1];
          const continuesRun = !!messaging && !!previous && previous.createdBy.id === result.createdBy.id;

          return (
            <div
              key={result.id}
              className="comment"
              data-user-comment={result.byCurrentUser}
              data-continues={continuesRun}
            >
              {!continuesRun && (
                <div className="byline">
                  <span className="author">{result.createdBy.name || anonymousName}</span>
                  <span className="timestamp">{formatTimestamp(result.createdOn)}</span>
                </div>
              )}
              <div className="message">
                <p>{result.content}</p>
              </div>
              {/* Only allow the user that created the message to be able to delete it. It sits
                  outside the byline so grouped messages keep their own delete control. */}
              {userId && userId === result.createdBy.id && (
                <span className="actions">
                  <GoabIconButton
                    title="delete message"
                    icon="trash"
                    variant="color"
                    size="small"
                    onClick={() => {
                      setDeleting(result);
                    }}
                  />
                </span>
              )}
            </div>
          );
        })}
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

// Bubble layout for the two-participant messaging conversations in the form apps. Opt-in, since
// the task app uses this same viewer for multi-party comments where bubbles don't apply.
const messagingLayout = css`
  /* The heading sits on the same tint as the messages, so the thread reads as one panel. */
  & > h3 {
    background: var(--goa-color-info-light);
    margin: 0;
    padding-top: var(--goa-space-m);
  }

  & > .comments {
    background: var(--goa-color-info-light);
    padding-top: var(--goa-space-m);
    padding-bottom: var(--goa-space-m);
    /* The tinted area runs right down to the compose box, with no white band between. */
    margin-bottom: 0;

    > .comment {
      /* A message column plus a gutter, so the delete control lines up down the far right
         whichever side the bubble sits on. The byline and bubble each take their own row and
         shrink to their own content; the byline's row collapses when a message is grouped. */
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      grid-template-rows: auto auto;
      width: 100%;
      margin: 0 0 var(--goa-space-2xs) 0;

      > .byline {
        grid-row: 1;
        grid-column: 1;
        justify-self: start;
        /* Horizontal padding matches the bubble's, so the name and the message text below it
           start on the same line. The byline and bubble share an edge, whichever side they
           sit on, so one value lines both sides up. */
        padding: 0 var(--goa-space-m) var(--goa-space-xs) var(--goa-space-m);

        /* Sized with the timestamp so the two read as one line, not a heading over a caption. */
        .author {
          font-size: var(--goa-font-size-2);
          line-height: var(--goa-line-height-2);
          padding-right: 0;
        }

        .author::after {
          content: ',';
        }

        .timestamp {
          font-size: var(--goa-font-size-2);
          color: var(--goa-color-text-secondary);
          margin-left: var(--goa-space-2xs);
        }
      }

      /* The message body is the bubble, sized to the message text. */
      > .message {
        grid-row: 2;
        grid-column: 1;
        justify-self: start;
        /* Capped so a long message wraps well short of the far side, rather than filling the
           width and losing the sense of which side it came from. */
        max-width: 80%;
        background: var(--goa-color-greyscale-white);
        border: 1px solid var(--goa-color-greyscale-200);
        border-radius: var(--goa-border-radius-xl);
        /* Vertical padding matches the corner radius, so the curve doesn't crowd the text. */
        padding: var(--goa-space-s) var(--goa-space-m);
      }

      /* Selected through the bubble so it outweighs the base rules, which inset the text to
         keep the two participants' messages apart. The bubble provides that separation now,
         so the text sits flush and the bubble can shrink to it. */
      > .message p {
        margin: 0;
        padding: 0;
        text-align: left;
        overflow-wrap: break-word;
        word-break: break-word;
      }

      /* Sits in the right-hand gutter beside its own bubble, so every message keeps a delete
         control whether or not it's grouped under someone else's byline. Qualified with the
         element so it outweighs the base rule that margins the last span of a comment. */
      > span.actions {
        grid-row: 2;
        grid-column: 2;
        align-self: center;
        /* Pulled into the area's right padding so the control is inset from the edge by the
           same amount that separates it from the bubble. */
        margin: 0 calc(var(--goa-space-2xs) - var(--goa-space-l)) 0 0;
        padding-left: var(--goa-space-2xs);
        /* The span is otherwise a line box, which pads the icon top and bottom. */
        line-height: 0;
        /* Half the icon button's own inset; keeps the control on a 24px target. */
        --goa-icon-button-small-padding: var(--goa-space-3xs);
      }
    }

    /* A new speaker starts a new group, set off from the run above it. */
    > .comment:not([data-continues='true']) {
      margin-top: var(--goa-space-m);
    }

    > .comment[data-user-comment='true'] {
      /* Sent messages sit against the right of their column; the gutter stays put. */
      > .byline,
      > .message {
        justify-self: end;
      }

      /* Sent messages read time-first: "11:39 am, You". */
      > .byline {
        .author {
          order: 2;
          margin-left: var(--goa-space-2xs);
        }

        .author::after {
          content: none;
        }

        .timestamp {
          order: 1;
          margin-left: 0;
        }

        .timestamp::after {
          content: ',';
        }
      }

      > .message {
        background: var(--goa-color-interactive-default);
        border-color: var(--goa-color-interactive-default);
      }

      /* Text stays flush and left-aligned even though the bubble itself sits right. */
      > .message p {
        margin: 0;
        padding: 0;
        color: var(--goa-color-text-light);
      }
    }
  }
`;

export const CommentsViewer = styled(CommentsViewerComponent)<{ $commentsHeight?: string; messaging?: boolean }>`
  display: flex;
  flex-direction: column;

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
    height: ${({ $commentsHeight }) => ($commentsHeight ? `${$commentsHeight}` : 'auto')};
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

  ${({ messaging }) => messaging && messagingLayout}
`;

export default CommentsViewer;
