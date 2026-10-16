import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { ProjectPlanner } from './projectPlanner';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useParams: jest.fn() }));
jest.mock('./overview', () => ({
  PlannerOverview: ({ onStart }: { onStart: () => void }) => (
    <button data-testid="overview-content" onClick={onStart}>
      overview
    </button>
  ),
}));
jest.mock('./solutions', () => ({ Solutions: () => <div data-testid="solutions-content" /> }));
jest.mock('./SolutionsWorkspace', () => ({ SolutionsWorkspace: () => <div data-testid="solutions-content" /> }));
jest.mock('./patterns', () => ({ Patterns: () => <div data-testid="patterns-content" /> }));

describe('ProjectPlanner', () => {
  const useParamsMock = useParams as jest.Mock;

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows the page title', () => {
    useParamsMock.mockReturnValue({ tab: 'overview' });

    const { getByTestId } = render(<ProjectPlanner />);

    expect(getByTestId('project-planner-title').textContent).toBe('Project planner service');
  });

  it('shows the beta badge', () => {
    useParamsMock.mockReturnValue({ tab: 'overview' });

    const { getByAltText } = render(<ProjectPlanner />);

    expect(getByAltText('Beta')).toBeTruthy();
  });

  it('shows the overview tab when the route tab is overview', () => {
    useParamsMock.mockReturnValue({ tab: 'overview' });

    const { getByTestId } = render(<ProjectPlanner />);

    expect(getByTestId('overview-content')).toBeTruthy();
  });

  it('shows the solutions tab when the route tab is solutions', () => {
    useParamsMock.mockReturnValue({ tab: 'solutions' });

    const { getByTestId } = render(<ProjectPlanner />);

    expect(getByTestId('solutions-content')).toBeTruthy();
  });

  it('shows the solutions tab when the route has a solution id', () => {
    useParamsMock.mockReturnValue({ id: 'solution-1' });

    const { getByTestId } = render(<ProjectPlanner />);

    expect(getByTestId('solutions-content')).toBeTruthy();
  });

  it('shows the patterns tab when the route tab is patterns', () => {
    useParamsMock.mockReturnValue({ tab: 'patterns' });

    const { getByTestId } = render(<ProjectPlanner />);

    expect(getByTestId('patterns-content')).toBeTruthy();
  });

  it('falls back to the overview tab for an unknown tab', () => {
    useParamsMock.mockReturnValue({ tab: 'settings' });

    const { getByTestId } = render(<ProjectPlanner />);

    expect(getByTestId('overview-content')).toBeTruthy();
  });

  it('only renders the active tab content', () => {
    useParamsMock.mockReturnValue({ tab: 'solutions' });

    const { queryByTestId } = render(<ProjectPlanner />);

    expect(queryByTestId('overview-content')).toBeNull();
  });

  it('navigates to the solutions tab when planning is started from the overview', () => {
    useParamsMock.mockReturnValue({ tab: 'overview' });
    const { getByTestId } = render(<ProjectPlanner />);

    fireEvent.click(getByTestId('overview-content'));

    expect(mockNavigate).toHaveBeenCalledWith('../solutions');
  });

  it('navigates when switching tabs by clicking, keeping the URL in sync', () => {
    useParamsMock.mockReturnValue({ tab: 'solutions' });
    const { getByTestId } = render(<ProjectPlanner />);

    fireEvent.click(getByTestId('tab-btn-0'));

    expect(mockNavigate).toHaveBeenCalledWith('../overview');
  });

  it('navigates one level up when switching tabs from an open solution', () => {
    useParamsMock.mockReturnValue({ id: 'solution-1' });
    const { getByTestId } = render(<ProjectPlanner />);

    fireEvent.click(getByTestId('tab-btn-0'));

    expect(mockNavigate).toHaveBeenCalledWith('../overview');
  });
});
