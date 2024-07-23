import { GoAButton, GoAButtonGroup, GoACircularProgress, GoAFormItem, GoATextArea } from '@abgov/react-components-new';
import moment from 'moment';
import { FunctionComponent } from 'react';
import styled from 'styled-components';

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
  typeLabel?: string;
  canComment: boolean;
  canLoadMore: boolean;
  comments: Comment[];
  draft: DraftComment;
  loading: boolean;
  commenting: boolean;
  onLoadMore: () => void;
  onUpdateDraft: (draft: DraftComment) => void;
  onAddComment: (draft: DraftComment) => void;
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
  typeLabel,
  canComment,
  canLoadMore,
  draft,
  comments,
  loading,
  commenting,
  onLoadMore,
  onUpdateDraft,
  onAddComment,
}) => {
  typeLabel = typeLabel || 'comment';
  return (
    <div className={className}>
      <h3>{typeLabel}s</h3>
      <div className="comments">
        {comments.map((result) => (
          <div key={result.id} className="comment" data-user-comment={result.byCurrentUser}>
            <div>
              <span>{result.createdBy.name}</span>
              <span>{formatTimestamp(result.createdOn)}</span>
            </div>
            <div>
              <p>{result.content}</p>
            </div>
          </div>
        ))}
        <GoACircularProgress variant="inline" size="small" visible={loading} />
        {!loading && canLoadMore && (
          <GoAButton type="tertiary" onClick={onLoadMore}>
            Load more
          </GoAButton>
        )}
      </div>
      <form>
        <GoAFormItem label={`New ${typeLabel}`}>
          <GoATextArea
            name="comment"
            value={draft.content || ''}
            disabled={!canComment}
            onChange={(_, value) => onUpdateDraft({ title: draft.title, content: value })}
            placeholder={`Write your ${typeLabel}...`}
            width="100%"
          />
        </GoAFormItem>
        <GoAButtonGroup alignment="end" mt="l">
          <GoAButton
            type="secondary"
            disabled={!draft.content}
            onClick={() => onUpdateDraft({ title: draft.title, content: null })}
          >
            Clear
          </GoAButton>
          <GoAButton type="primary" disabled={!draft.content || commenting} onClick={() => onAddComment(draft)}>
            Add {typeLabel}
          </GoAButton>
        </GoAButtonGroup>
      </form>
    </div>
  );
};

export const CommentsViewer = styled(CommentsViewerComponent)`
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
    flex: 1 1 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column-reverse;
    padding-left: var(--goa-space-l);
    padding-right: var(--goa-space-l);
    > .comment {
      margin: var(--goa-space-s);
      margin-bottom: var(--goa-space-l);

      span:first-child {
        font-weight: bold;
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
