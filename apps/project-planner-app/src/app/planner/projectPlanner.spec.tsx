import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { ProjectPlanner } from './projectPlanner';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate, useParams: jest.fn() }));
jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
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

  const withRoles = (roles: string[]) =>
    (useSelector as jest.Mock).mockImplementation((selector) =>
      selector({ session: { resourceAccess: { 'urn:ads:platform:project-planner-service': { roles } } } }),
    );

  beforeEach(() => {
    withRoles(['planner-user']);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows the patterns tab to planner admins', () => {
    withRoles(['planner-admin']);
    useParamsMock.mockReturnValue({ tab: 'overview' });

    const { getByText } = render(<ProjectPlanner />);

    expect(getByText('Patterns')).toBeTruthy();
  });

  it('hides the patterns tab from users who are not planner admins', () => {
    useParamsMock.mockReturnValue({ tab: 'overview' });

    const { queryByText } = render(<ProjectPlanner />);

    expect(queryByText('Patterns')).toBeNull();
  });

  it('shows the overview instead of patterns to users who are not planner admins', () => {
    useParamsMock.mockReturnValue({ tab: 'patterns' });

    const { getByTestId, queryByTestId } = render(<ProjectPlanner />);

    expect(getByTestId('overview-content')).toBeTruthy();
    expect(queryByTestId('patterns-content')).toBeNull();
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

  it('hides the page title and tabs when viewing a solution, since its own back button returns to the list', () => {
    useParamsMock.mockReturnValue({ id: 'solution-1' });

    const { queryByTestId } = render(<ProjectPlanner />);

    expect(queryByTestId('project-planner-title')).toBeNull();
    expect(queryByTestId('project-planner-overview-tab')).toBeNull();
    expect(queryByTestId('project-planner-solutions-tab')).toBeNull();
    expect(queryByTestId('project-planner-patterns-tab')).toBeNull();
  });

  it('shows the patterns tab when the route tab is patterns', () => {
    withRoles(['planner-admin']);
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
});
