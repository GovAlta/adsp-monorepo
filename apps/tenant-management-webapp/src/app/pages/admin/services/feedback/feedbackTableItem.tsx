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

  function formatDate(dateString) {
    const date = new Date(dateString);
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const month = monthNames[date.getUTCMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    let hours = date.getHours();
    let minutes = date.getMinutes()!;
    let suffix = suffixes[day % 10] || suffixes[0];
    if (day >= 11 && day <= 13) suffix = 'th';
    minutes = minutes < 10 ? 0 + minutes : minutes;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedDate = ` ${month} ${day}${suffix}, ${year}`;
    const formattedDateTime = ` ${month} ${day}${suffix}, ${year} ${hours}:${minutes}${ampm}`;
    return { formattedDate, formattedDateTime };
  }
  const submissionDate = formatDate(feedback.timestamp);
  const ratingValue = Rating[feedback.value.rating as unknown as keyof typeof Rating];

  return (
    <>
      <tr>
        <td data-testid="feedback-list-created-on">{submissionDate.formattedDate}</td>
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
                Feedback was submitted at a {feedback.context.view} on {submissionDate.formattedDateTime}
              </p>
              <h2>Rating = {ratingValue}</h2>
              {feedback.value.comment && (
                <>
                  <h2>Additional comments</h2>
                  <span>{feedback.value.comment}</span>
                </>
              )}

              {feedback.value.technicalIssue && (
                <>
                  <h2>Technical issues</h2>
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
