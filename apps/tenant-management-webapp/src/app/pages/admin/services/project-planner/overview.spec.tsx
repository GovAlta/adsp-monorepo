import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { PlannerOverview } from './overview';

describe('PlannerOverview', () => {
  it('explains the planner and starts planning', () => {
    const onStart = jest.fn();
    const { getByText, getByTestId } = render(<PlannerOverview onStart={onStart} />);
    expect(getByText(/helps you describe a business problem/i)).toBeTruthy();
    fireEvent.click(getByTestId('start-solution'));
    expect(onStart).toHaveBeenCalled();
  });
});
