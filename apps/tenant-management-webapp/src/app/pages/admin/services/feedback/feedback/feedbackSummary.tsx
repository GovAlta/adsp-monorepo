import React from 'react';
import styled from 'styled-components';
import { FeedbackSummary as FeedbackSummaryModel } from '@store/feedback/models';

interface FeedbackSummaryProps {
  summary: FeedbackSummaryModel;
}

const Summary = styled.div`
  margin: var(--goa-space-l) 0;
  font-size: var(--goa-font-size-6);
  font-weight: var(--goa-font-weight-medium);
  line-height: 1.5;
`;

const Separator = styled.span`
  margin: 0 var(--goa-space-s);
`;

export const FeedbackSummary = ({ summary }: FeedbackSummaryProps): JSX.Element => {
  if (summary.totalResponses === 0) {
    return <Summary data-testid="feedback-summary">No responses</Summary>;
  }

  return (
    <Summary data-testid="feedback-summary">
      <strong>Total responses</strong> {summary.totalResponses}
      <Separator aria-hidden="true"> | </Separator>
      <strong>Average rating</strong> {summary.averageRating?.toFixed(1)}/5
      <Separator aria-hidden="true"> | </Separator>
      <strong>Comments</strong> {summary.responsesWithComments}
      <Separator aria-hidden="true"> | </Separator>
      <strong>Issues</strong> {summary.responsesWithIssues}
    </Summary>
  );
};
