import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectPlannerRouter } from './routers';

jest.mock('./projectPlanner', () => {
  const { useParams } = jest.requireActual('react-router-dom');
  return { ProjectPlanner: () => <div data-testid="project-planner">tab:{useParams().tab}</div> };
});
jest.mock('./solutionDetail', () => {
  const { useParams } = jest.requireActual('react-router-dom');
  return { SolutionDetail: () => <div data-testid="solution-detail">solution:{useParams().id}</div> };
});

describe('ProjectPlannerRouter', () => {
  const renderAt = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <ProjectPlannerRouter />
      </MemoryRouter>,
    );

  it('renders the solution detail page for a solution route', () => {
    const { getByTestId } = renderAt('/solution/solution-1');

    expect(getByTestId('solution-detail').textContent).toBe('solution:solution-1');
  });

  it.each(['overview', 'solutions', 'patterns'])('renders the project planner for the %s tab', (tab) => {
    const { getByTestId } = renderAt(`/${tab}`);

    expect(getByTestId('project-planner').textContent).toBe(`tab:${tab}`);
  });

  it('redirects the root route to the overview tab', () => {
    const { getByTestId } = renderAt('/');

    expect(getByTestId('project-planner').textContent).toBe('tab:overview');
  });

  it('redirects unknown nested routes to the overview tab', () => {
    const { getByTestId } = renderAt('/solutions/extra/path');

    expect(getByTestId('project-planner').textContent).toBe('tab:overview');
  });
});
