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

  it('shows not assessed text without confidence', () => {
    const { getByTestId } = render(<ConfidenceBar />);
    expect(getByTestId('confidence-empty').textContent).toContain('not assessed yet');
  });

  it('renders progress bar and sufficient badge', () => {
    const { container, getByTestId, getByText } = render(<ConfidenceBar confidence={confidence} />);
    const bar = getByTestId('confidence-progress');
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('62');
    expect(getByText('Confidence: 62%')).toBeTruthy();
    expect(goa(container, 'confidence-badge').getAttribute('type')).toBe('success');
    expect(goa(container, 'confidence-badge').getAttribute('content')).toBe('Sufficient to propose a solution');
  });

  it('renders important badge below threshold', () => {
    const { container } = render(<ConfidenceBar confidence={{ ...confidence, score: 30 }} />);
    expect(goa(container, 'confidence-badge').getAttribute('type')).toBe('important');
    expect(goa(container, 'confidence-badge').getAttribute('content')).toBe('Below 50% — more detail needed');
  });

  it('renders factor breakdown with notes', () => {
    const { container, getByTestId, getByText, queryByText } = render(<ConfidenceBar confidence={confidence} />);
    expect(goa(container, 'confidence-breakdown').getAttribute('heading')).toBe('Confidence breakdown');
    expect(getByTestId('confidence-factor-bar-users').getAttribute('aria-valuenow')).toBe('80');
    expect(getByText('Clear')).toBeTruthy();
    expect(getByText('20%')).toBeTruthy();
    expect(queryByText('Data note')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ConfidenceBar confidence={confidence} />);
    await expectNoA11yViolations(container);
  });
});
