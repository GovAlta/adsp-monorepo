import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectPlannerRouter } from './routers';

jest.mock('./projectPlanner', () => {
  const { useParams } = jest.requireActual('react-router-dom');
  return {
    ProjectPlanner: () => {
      const { tab, id } = useParams();
      return (
        <div data-testid="project-planner">
          tab:{tab} id:{id}
        </div>
      );
    },
  };
});

describe('ProjectPlannerRouter', () => {
  const renderAt = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <ProjectPlannerRouter />
      </MemoryRouter>,
    );

  it('renders the project planner with the solution id for a solution route', () => {
    const { getByTestId } = renderAt('/solutions/solution-1');

    expect(getByTestId('project-planner').textContent).toBe('tab: id:solution-1');
  });

  it.each(['overview', 'solutions', 'patterns'])('renders the project planner for the %s tab', (tab) => {
    const { getByTestId } = renderAt(`/${tab}`);

    expect(getByTestId('project-planner').textContent).toBe(`tab:${tab} id:`);
  });

  it('redirects the root route to the overview tab', () => {
    const { getByTestId } = renderAt('/');

    expect(getByTestId('project-planner').textContent).toBe('tab:overview id:');
  });

  it('redirects unknown nested routes to the overview tab', () => {
    const { getByTestId } = renderAt('/solutions/extra/path');

    expect(getByTestId('project-planner').textContent).toBe('tab:overview id:');
  });
});
