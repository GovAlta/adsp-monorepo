import { GoAButton, GoAButtonGroup, GoACircularProgress, GoAFormItem, GoATextArea } from '@abgov/react-components-new';
import moment, { Moment } from 'moment';
import { FunctionComponent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  AppDispatch,
  addComment,
  canCommentSelector,
  commentActions,
  commentExecutingSelector,
  commentLoadingSelector,
  commentsSelector,
  draftSelector,
  loadComments,
  selectedTopicSelector,
} from '../state';

interface CommentsViewerProps {
  className?: string;
  resourceId: string;
}

function formatTimestamp(value: Moment): string {
  const now = moment();
  // Don't include the year if the timestamp is for the current year.
  const year = value?.year() === now.year() ? '' : ' YYYY';
  // Show day of the week if in the current week.
  const day = value?.week() === now.week() ? 'dddd' : 'MMMM D';
  return value?.format(`${day}${year}, h:mm a`);
}

const CommentsViewerComponent: FunctionComponent<CommentsViewerProps> = ({ className }) => {
  const topic = useSelector(selectedTopicSelector);
  const { results, next } = useSelector(commentsSelector);
  const loading = useSelector(commentLoadingSelector);
  const executing = useSelector(commentExecutingSelector);
  const { title, content } = useSelector(draftSelector);
  const canComment = useSelector(canCommentSelector);

  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className={className}>
      <h3>Comments</h3>
      <div className="comments">
        {results.map((result) => (
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
        {!loading && next && (
          <GoAButton type="tertiary" onClick={() => dispatch(loadComments({ next, topic }))}>
            Load more
          </GoAButton>
        )}
      </div>
      <form>
        <GoAFormItem label="New comment">
          <GoATextArea
            name="comment"
            value={content}
            disabled={!canComment}
            onChange={(_, value) => dispatch(commentActions.setDraftComment({ title, content: value }))}
            placeholder="Write your comment..."
            width="100%"
          />
        </GoAFormItem>
        <GoAButtonGroup alignment="end" mt="l">
          <GoAButton
            type="secondary"
            disabled={!content}
            onClick={() => dispatch(commentActions.setDraftComment({ title, content: null }))}
          >
            Clear
          </GoAButton>
          <GoAButton
            type="primary"
            disabled={!content || executing}
            onClick={() => {
              dispatch(addComment({ topic, comment: { title, content } }));
            }}
          >
            Add comment
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
    padding-left: var(--goa-spacing-l);
    padding-right: var(--goa-spacing-l);
    padding-bottom: var(--goa-spacing-s);
  }
  & > form {
    background: var(--goa-color-greyscale-100);
    flex-shrink: 0;
    flex-grow: 0;
    max-height: 40vh;
    padding: var(--goa-spacing-l);
    padding-top: var(--goa-spacing-s);
  }
  & > .comments {
    flex: 1 1 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column-reverse;
    padding-left: var(--goa-spacing-l);
    padding-right: var(--goa-spacing-l);
    > .comment {
      margin: var(--goa-spacing-s);
      margin-bottom: var(--goa-spacing-l);

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
