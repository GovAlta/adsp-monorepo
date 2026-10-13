import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { SolutionDetail } from './solutionDetail';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useParams: () => ({ id: 'solution-1' }) }));
jest.mock('./SolutionWorkplace', () => ({
  __esModule: true,
  default: ({ solutionId, onBack }: { solutionId: string; onBack: () => void }) => (
    <button data-testid="workplace" onClick={onBack}>
      {solutionId}
    </button>
  ),
}));

describe('SolutionDetail', () => {
  it('renders the workplace for the routed solution', () => {
    const { getByTestId } = render(<SolutionDetail />);

    expect(getByTestId('workplace').textContent).toBe('solution-1');
  });

  it('navigates back to the solutions list', () => {
    const { getByTestId } = render(<SolutionDetail />);

    fireEvent.click(getByTestId('workplace'));

    expect(mockNavigate).toHaveBeenCalledWith('../solutions');
  });
});
