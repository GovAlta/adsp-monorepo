import React from 'react';
import { render } from '@testing-library/react';
import { ConfidenceBar } from './ConfidenceBar';
import { expectNoA11yViolations } from './testing/axe';
import { SolutionConfidence } from './model';

const goa = (container: HTMLElement, testId: string) => container.querySelector(`[testid="${testId}"]`) as Element;

describe('ConfidenceBar', () => {
  const confidence: SolutionConfidence = {
    score: 62,
    threshold: 50,
    factors: [
      { id: 'users', label: 'Users', score: 80, note: 'Clear' },
      { id: 'data', label: 'Data', score: 20 },
    ],
  };

  it('shows plain guidance without confidence', () => {
    const { getByTestId } = render(<ConfidenceBar />);
    expect(getByTestId('confidence-empty').textContent).toContain('after you continue');
  });

  it('renders progress bar and sufficient badge', () => {
    const { container, getByTestId, getByText } = render(<ConfidenceBar confidence={confidence} />);
    const bar = getByTestId('confidence-progress');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('62');
    expect(getByText('Confidence: 62%')).toBeTruthy();
    expect(goa(container, 'confidence-badge').getAttribute('type')).toBe('success');
    expect(goa(container, 'confidence-badge').getAttribute('content')).toBe('Enough detail to prepare a plan');
  });

  it('renders important badge below threshold', () => {
    const { container } = render(<ConfidenceBar confidence={{ ...confidence, score: 30 }} />);
    expect(goa(container, 'confidence-badge').getAttribute('type')).toBe('important');
    expect(goa(container, 'confidence-badge').getAttribute('content')).toBe('More detail may help improve this plan');
  });

  it('shows an analyzing indicator instead of the score while a background analysis is running', () => {
    const { container, getByText } = render(<ConfidenceBar confidence={confidence} analyzing />);
    expect(getByText('Confidence: Analyzing…')).toBeTruthy();
    expect(goa(container, 'confidence-badge').getAttribute('type')).toBe('information');
    expect(goa(container, 'confidence-badge').getAttribute('content')).toBe('Analyzing…');
  });

  it('renders a plain-language factor breakdown without contradictory notes', () => {
    const { container, getByTestId, getByText, queryByText } = render(<ConfidenceBar confidence={confidence} />);
    expect(goa(container, 'confidence-breakdown').getAttribute('heading')).toBe(
      'How well the planner understands your request',
    );
    expect(getByTestId('confidence-factor-bar-users').getAttribute('aria-valuenow')).toBe('80');
    expect(getByText('20%')).toBeTruthy();
    expect(queryByText('Not described yet.')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ConfidenceBar confidence={confidence} />);
    await expectNoA11yViolations(container);
  });
});
