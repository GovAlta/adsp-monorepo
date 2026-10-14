import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { SolutionsWorkspace } from './SolutionsWorkspace';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useParams: jest.fn() }));
jest.mock('./solutions', () => ({
  Solutions: ({ selectedId, onSelect }: { selectedId?: string; onSelect: (id?: string) => void }) => (
    <div data-testid="solutions-sidebar">
      selected:{selectedId}
      <button data-testid="select-other" onClick={() => onSelect('solution-2')}>
        select
      </button>
    </div>
  ),
}));
jest.mock('./SolutionWorkplace', () => ({
  __esModule: true,
  default: ({ solutionId, onBack }: { solutionId: string; onBack: () => void }) => (
    <button data-testid="workplace" onClick={onBack}>
      {solutionId}
    </button>
  ),
}));

describe('SolutionsWorkspace', () => {
  const useParamsMock = useParams as jest.Mock;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows a placeholder when no solution is selected', () => {
    useParamsMock.mockReturnValue({});

    const { container } = render(<SolutionsWorkspace />);

    expect(container.querySelector('goa-callout[testid="no-solution-selected"]')).toBeTruthy();
  });

  it('shows the workplace for the routed solution id', () => {
    useParamsMock.mockReturnValue({ id: 'solution-1' });

    const { getByTestId } = render(<SolutionsWorkspace />);

    expect(getByTestId('workplace').textContent).toBe('solution-1');
  });

  it('passes the selected id down to the sidebar', () => {
    useParamsMock.mockReturnValue({ id: 'solution-1' });

    const { getByTestId } = render(<SolutionsWorkspace />);

    expect(getByTestId('solutions-sidebar').textContent).toContain('solution-1');
  });

  it('navigates to the selected solution', () => {
    useParamsMock.mockReturnValue({});
    const { getByTestId } = render(<SolutionsWorkspace />);

    fireEvent.click(getByTestId('select-other'));

    expect(mockNavigate).toHaveBeenCalledWith('../solutions/solution-2');
  });

  it('navigates back to the unselected solutions view', () => {
    useParamsMock.mockReturnValue({ id: 'solution-1' });
    const { getByTestId } = render(<SolutionsWorkspace />);

    fireEvent.click(getByTestId('workplace'));

    expect(mockNavigate).toHaveBeenCalledWith('../solutions');
  });
});
