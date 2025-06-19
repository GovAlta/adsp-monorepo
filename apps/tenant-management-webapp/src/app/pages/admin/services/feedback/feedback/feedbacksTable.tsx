import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { FeedbackTableItem } from './feedbackTableItem';
import { Feedback } from '@store/feedback/models';
import { TableDiv } from '../styled-components';

export interface FeedbackTableProps {
  feedbacks: Feedback[];
}

export const FeedbackListTable: FunctionComponent<FeedbackTableProps> = ({ feedbacks }) => {
  return (
    <TableDiv>
      <DataTable data-testid="feedback-table">
        <thead data-testid="feedback-table-header">
          <tr>
            <th data-testid="feedback-table-header-submitted-on">Submitted on</th>
            <th data-testid="feedback-table-header-view">View</th>
            <th data-testid="feedback-table-header-rating">Rating</th>
            <th data-testid="feedback-table-header-action">Action</th>
          </tr>
        </thead>
        <tbody>
          {feedbacks.map((feedback, id) => {
            return <FeedbackTableItem key={id * 11} id={id} feedback={feedback} />;
          })}
        </tbody>
      </DataTable>
    </TableDiv>
  );
};
