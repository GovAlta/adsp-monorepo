import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { ProgressStepper, ProgressStepDefinition } from './ProgressStepper';
import { expectNoA11yViolations } from './testing/axe';

describe('ProgressStepper', () => {
  const steps: ProgressStepDefinition[] = [
    { id: 1, label: 'Problem statement', complete: true },
    { id: 2, label: 'Discovery conversation', complete: false },
    { id: 3, label: 'Proposed solution', complete: false },
  ];

  it('renders a numbered button for each step', () => {
    const { getByTestId } = render(<ProgressStepper steps={steps} activeId={1} onSelect={jest.fn()} />);

    expect(getByTestId('progress-step-1').textContent).toBe('1');
    expect(getByTestId('progress-step-2').textContent).toBe('2');
    expect(getByTestId('progress-step-3').textContent).toBe('3');
  });

  it('labels each step for screen readers', () => {
    const { getByTestId } = render(<ProgressStepper steps={steps} activeId={1} onSelect={jest.fn()} />);

    expect(getByTestId('progress-step-2').getAttribute('aria-label')).toBe('Go to step 2: Discovery conversation');
  });

  it('marks the active step with aria-current', () => {
    const { getByTestId } = render(<ProgressStepper steps={steps} activeId={2} onSelect={jest.fn()} />);

    expect(getByTestId('progress-step-2').getAttribute('aria-current')).toBe('step');
  });

  it('does not mark inactive steps with aria-current', () => {
    const { getByTestId } = render(<ProgressStepper steps={steps} activeId={2} onSelect={jest.fn()} />);

    expect(getByTestId('progress-step-1').getAttribute('aria-current')).toBeNull();
  });

  it('calls onSelect with the clicked step id', () => {
    const onSelect = jest.fn();
    const { getByTestId } = render(<ProgressStepper steps={steps} activeId={1} onSelect={onSelect} />);

    fireEvent.click(getByTestId('progress-step-3'));

    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ProgressStepper steps={steps} activeId={1} onSelect={jest.fn()} />);

    await expectNoA11yViolations(container);
  });
});
