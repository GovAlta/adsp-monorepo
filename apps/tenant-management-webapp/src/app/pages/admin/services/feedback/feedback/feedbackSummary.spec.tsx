import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbackSummary, FeedbackSummaryLoading } from './feedbackSummary';

describe('FeedbackSummary', () => {
  it('displays all aggregate values', () => {
    render(
      <FeedbackSummary
        summary={{
          totalResponses: 247,
          averageRating: 3.8,
          responsesWithComments: 38,
          responsesWithIssues: 21,
        }}
      />,
    );

    expect(screen.getByTestId('feedback-summary')).toHaveTextContent(
      'Total responses 247 | Average rating 3.8/5 | Comments 38 | Issues 21',
    );
    expect(screen.getByText('Total responses').tagName).toBe('STRONG');
    expect(screen.getByText('Average rating').tagName).toBe('STRONG');
    expect(screen.getByText('Comments').tagName).toBe('STRONG');
    expect(screen.getByText('Issues').tagName).toBe('STRONG');
  });

  it('displays no responses for an empty result set', () => {
    render(
      <FeedbackSummary
        summary={{
          totalResponses: 0,
          averageRating: null,
          responsesWithComments: 0,
          responsesWithIssues: 0,
        }}
      />,
    );

    expect(screen.getByTestId('feedback-summary')).toHaveTextContent('No responses');
  });

  it('displays a text skeleton while the summary is loading', () => {
    const { baseElement } = render(<FeedbackSummaryLoading />);

    expect(screen.getByTestId('feedback-summary-loading')).toBeInTheDocument();
    expect(baseElement.querySelector('goa-skeleton[type="text"]')).toBeInTheDocument();
  });
});
