import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { Feedback } from '@store/feedback/models';
import { TableDiv } from '../styled-components';
import moment from 'moment';

export interface FeedbackTableProps {
  feedbacks: Feedback[];
}

export const FeedbackListTable: FunctionComponent<FeedbackTableProps> = ({ feedbacks }) => {
  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return {
      formattedDate: moment(date).format('MMMM Do, YYYY'),
      formattedDateTime: moment(date).format('h:mm A'),
    };
  }

  return (
    <TableDiv>
      <DataTable data-testid="feedback-table">
        <thead data-testid="feedback-table-header">
          <tr>
            <th data-testid="feedback-table-header-submitted-on">Submitted On</th>
            <th data-testid="feedback-table-header-view">View</th>
            <th data-testid="feedback-table-header-rating">Rating</th>
            <th data-testid="feedback-table-header-comments">Comments</th>
            <th data-testid="feedback-table-header-technical-issue">Technical Issue</th>
          </tr>
        </thead>
        <tbody>
          {feedbacks.map((feedback, idx) => {
            const submissionDate = formatDate(feedback.timestamp);
            const ratingValue = feedback.value.rating ?? '-';

            return (
              <tr key={idx}>
                <td>
                  {submissionDate.formattedDate} {submissionDate.formattedDateTime}
                </td>
                <td>{feedback.context.view ?? '-'}</td>
                <td>{ratingValue}</td>
                <td>{feedback.value.comment && feedback.value.comment.trim() !== '' ? feedback.value.comment : '-'}</td>
                <td>
                  {feedback.value.technicalIssue && feedback.value.technicalIssue.trim() !== ''
                    ? feedback.value.technicalIssue
                    : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    </TableDiv>
  );
};
