import React, { FunctionComponent } from 'react';
import DataTable from '@components/DataTable';
import { FeedbackTableItem } from './feedbackTableItem';
import { Feedback } from '@store/feedback/models';

import { HeaderFont, TableDiv } from './styled-components';

export interface FeedbackTableProps {
  feedbacks: Feedback[];
}
export const FeedbackListTable: FunctionComponent<FeedbackTableProps> = ({ feedbacks }) => {
  return (
    <>
      <HeaderFont>
        <h2>Feedback list</h2>
      </HeaderFont>
      <TableDiv>
        <DataTable data-testid="feedback-table">
          <thead data-testid="feedback-table-header">
            <tr>
              <th data-testid="feedback-table-header-submitted-date">Date Submitted</th>
              <th data-testid="feedback-table-header-correlation-id">Correlation Id</th>
              <th data-testid="feedback-table-header-rating">Rating</th>
              <th data-testid="feedback-table-header-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((feedback) => {
              return <FeedbackTableItem key={feedback} id={feedback} feedback={feedback} />;
            })}
          </tbody>
        </DataTable>
      </TableDiv>
    </>
  );
};
