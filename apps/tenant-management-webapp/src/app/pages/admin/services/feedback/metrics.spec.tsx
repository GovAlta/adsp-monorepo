import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { FeedbackMetrics } from './metrics';

const mockStore = configureStore([]);

// Ratings arrive from value-service on the recorded 0-based scale.
const renderMetrics = (metrics: Record<string, number | null>) =>
  render(
    <Provider store={mockStore({ feedback: { metrics } })}>
      <FeedbackMetrics />
    </Provider>,
  );

const textOf = (baseElement: Element, id: string) => baseElement.querySelector(`#${id}`)?.textContent?.trim();

describe('FeedbackMetrics', () => {
  it('shows both ratings on the same label scale', () => {
    // The reported defect: a recorded average of 2 rendered as "2 - Difficult" while the
    // recorded lowest of 2 rendered as "3 - Neutral", because only the lowest was shifted.
    const { baseElement } = renderMetrics({
      feedbackCount: 10,
      averageRating: 2,
      lowestRating: 2,
      momCountPercent: null,
      momAvgRatingPercent: null,
      momLowestRatingPercent: null,
    });

    expect(textOf(baseElement, 'feedback-avg-rating')).toBe('3 - Neutral');
    expect(textOf(baseElement, 'feedback-lowest-rating')).toBe('3 - Neutral');
  });

  it('never shows a lowest rating above the average', () => {
    const { baseElement } = renderMetrics({
      feedbackCount: 25,
      averageRating: 2.4,
      lowestRating: 1,
      momCountPercent: null,
      momAvgRatingPercent: null,
      momLowestRatingPercent: null,
    });

    expect(textOf(baseElement, 'feedback-avg-rating')).toBe('3 - Neutral');
    expect(textOf(baseElement, 'feedback-lowest-rating')).toBe('2 - Difficult');
  });

  it('renders the worst possible rating rather than falling back to a bare number', () => {
    // Rating.terrible is 0, so a truthiness check here dropped the label entirely.
    const { baseElement } = renderMetrics({
      feedbackCount: 3,
      averageRating: 0,
      lowestRating: 0,
      momCountPercent: null,
      momAvgRatingPercent: null,
      momLowestRatingPercent: null,
    });

    expect(textOf(baseElement, 'feedback-avg-rating')).toBe('1 - Very Difficult');
    expect(textOf(baseElement, 'feedback-lowest-rating')).toBe('1 - Very Difficult');
  });

  it('shows the worst rating submitted alongside the average', () => {
    // Five submissions displayed as 5, 5, 1, 2, 1 — recorded 4, 4, 0, 1, 0. Mean 1.8, lowest 0.
    const { baseElement } = renderMetrics({
      feedbackCount: 5,
      averageRating: 1.8,
      lowestRating: 0,
      momCountPercent: null,
      momAvgRatingPercent: null,
      momLowestRatingPercent: null,
    });

    expect(textOf(baseElement, 'feedback-avg-rating')).toBe('3 - Neutral');
    expect(textOf(baseElement, 'feedback-lowest-rating')).toBe('1 - Very Difficult');
  });

  it('shows a placeholder when there is no rating data', () => {
    const { baseElement } = renderMetrics({
      feedbackCount: 0,
      averageRating: null,
      lowestRating: null,
      momCountPercent: null,
      momAvgRatingPercent: null,
      momLowestRatingPercent: null,
    });

    expect(textOf(baseElement, 'feedback-avg-rating')).toBe('-');
    expect(textOf(baseElement, 'feedback-lowest-rating')).toBe('-');
  });
});
