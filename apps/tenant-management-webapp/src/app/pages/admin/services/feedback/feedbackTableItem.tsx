import React, { FunctionComponent, useEffect, useState } from 'react';
import { IconDiv, MoreDetails } from './styled-components';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { Feedback, Rating } from '@store/feedback/models';
import { URL } from './styled-components';
import moment from 'moment';

interface FeedbackTableItemProps {
  id: string;
  feedback: Feedback;
}

export const FeedbackTableItem: FunctionComponent<FeedbackTableItemProps> = ({
  id,
  feedback,
}: FeedbackTableItemProps) => {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setShowDetails(false);
  }, [feedback]);

  function formatDate(dateString) {
    const date = new Date(dateString);
    const formattedDate = moment(date).format('MMMM Do, YYYY');
    const formattedDateTime = moment(date).format('h:mm A');
    return { formattedDate, formattedDateTime };
  }
  const submissionDate = formatDate(feedback.timestamp);
  const ratingValue = Rating[feedback.value.rating as unknown as keyof typeof Rating];

  return (
    <>
      <tr>
        <td data-testid={`feedback-list-created-on_${id}`}>{submissionDate.formattedDate}</td>
        <td data-testid={`feedback-list_${id}`}>
          <URL>{feedback.context.view}</URL>
        </td>
        <td data-testid={`feedback-list-rating_${id}`}>{ratingValue}</td>
        <td data-testid={`feedback-list-action_${id}`}>
          <IconDiv>
            <GoAContextMenuIcon
              title="Toggle details"
              type={showDetails ? 'eye-off' : 'eye'}
              onClick={() => setShowDetails(!showDetails)}
              testId={`toggle-details-visibility_${id}`}
            />
          </IconDiv>
        </td>
      </tr>
      {showDetails && (
        <tr>
          <td
            colSpan={5}
            style={{
              padding: '0px',
            }}
          >
            <MoreDetails data-testId="moredetails">
              <p>
                Feedback was submitted for '{feedback.context.view}' on {submissionDate.formattedDate}{' '}
                {submissionDate.formattedDateTime}
              </p>
              <h2>Rating</h2>
              <span data-testId={`feedbackRating_${id}`}>{ratingValue}</span>
              {feedback.value.comment && (
                <>
                  <h2>Comments</h2>
                  <span data-testId={`feedbackComments_${id}`}>{feedback.value.comment}</span>
                </>
              )}

              {feedback.value.technicalIssue && (
                <>
                  <h2>Technical issues</h2>
                  <span data-testId={`feedbackTechnicalIssue_${id}`}>{feedback.value.technicalIssue}</span>
                </>
              )}
            </MoreDetails>
          </td>
        </tr>
      )}
    </>
  );
};
