import React, { FunctionComponent, useEffect, useState } from 'react';
import { IconDiv, MoreDetails } from './styled-components';
import { GoAContextMenuIcon } from '@components/ContextMenu';
import { Feedback, Rating } from '@store/feedback/models';
import { URL } from './styled-components';

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

  const createdOnDate = new Date(feedback.timestamp);
  // Format the createdOn date
  const formattedCreatedOn = `${createdOnDate.toISOString().substr(0, 10)}`;

  const ratingValue = Rating[feedback.value.rating as unknown as keyof typeof Rating];

  return (
    <>
      <tr>
        <td data-testid="feedback-list-created-on">{formattedCreatedOn}</td>
        <td data-testid="feedback-list-correlation-id">
          <URL>{feedback.correlationId}</URL>
        </td>
        <td data-testid="feedback-list-rating">{ratingValue}</td>
        <td data-testid="feedback-list-action">
          <IconDiv>
            <GoAContextMenuIcon
              title="Toggle details"
              type={showDetails ? 'eye-off' : 'eye'}
              onClick={() => setShowDetails(!showDetails)}
              testId="toggle-details-visibility"
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
                Feedback was submitted at view {feedback.context.view} on {formattedCreatedOn}
              </p>
              <p>Additional Comments</p>
              <span>{feedback.value.comment}</span>
              {feedback.value.technicalIssue && (
                <>
                  <p>Technical issues</p>
                  <span>{feedback.value.technicalIssue}</span>
                </>
              )}
            </MoreDetails>
          </td>
        </tr>
      )}
    </>
  );
};
