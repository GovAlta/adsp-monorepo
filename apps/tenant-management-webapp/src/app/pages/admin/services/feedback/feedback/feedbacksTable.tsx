import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { Feedback } from '@store/feedback/models';
import { TableDiv } from '../styled-components';
import { Rating } from '@store/feedback/models';
import moment from 'moment';
import { FeedbackTableItem } from './feedbackTableItem';

export interface FeedbackTableProps {
  feedbacks: Feedback[];
  showDetailsToggle?: boolean;
}

export const FeedbackListTable: FunctionComponent<FeedbackTableProps> = ({ feedbacks, showDetailsToggle = true }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return moment(date).format('MMMM D, YYYY h:mm A');
  };

  return (
    <TableDiv>
      <DataTable data-testid="feedback-table">
        <thead data-testid="feedback-table-header">
          <tr>
            <th data-testid="feedback-table-header-submitted-on">Date submitted</th>
            <th data-testid="feedback-table-header-view">Page</th>
            <th data-testid="feedback-table-header-rating">Rating</th>
            {!showDetailsToggle && <th data-testid="feedback-table-header-comment">Comment</th>}
            {!showDetailsToggle && <th data-testid="feedback-table-header-issue">Issue</th>}
            {showDetailsToggle && <th data-testid="feedback-table-header-action">Action</th>}
          </tr>
        </thead>
        <tbody>
          {feedbacks.map((feedback, id) => {
            const submissionDate = formatDate(feedback.timestamp);
            const ratingValue = Rating[feedback.value.rating as keyof typeof Rating] ?? '-';
            const view = feedback.context.view ?? '-';

            if (!showDetailsToggle) {
              return (
                <tr key={id}>
                  <td>{submissionDate}</td>
                  <td>{view}</td>
                  <td>{ratingValue}</td>
                  <td>{feedback.value.comment?.trim() || '-'}</td>
                  <td>{feedback.value.technicalIssue?.trim() || '-'}</td>
                </tr>
              );
            }

            return (
              <FeedbackTableItem key={id * 11} id={id} feedback={feedback} showDetailsToggle={showDetailsToggle} />
            );
          })}
        </tbody>
      </DataTable>
    </TableDiv>
  );
};
