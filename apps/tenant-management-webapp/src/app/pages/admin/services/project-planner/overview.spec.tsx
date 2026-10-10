import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { PlannerOverview } from './overview';

describe('PlannerOverview', () => {
  it('explains the planner', () => {
    const { getByText } = render(<PlannerOverview onStart={jest.fn()} />);

    expect(getByText(/helps you describe a business problem/i)).toBeTruthy();
  });

  it('starts planning when the start button is selected', () => {
    const onStart = jest.fn();
    const { container } = render(<PlannerOverview onStart={onStart} />);

    fireEvent(container.querySelector('goa-button[testid="start-solution"]') as Element, new CustomEvent('_click'));

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
