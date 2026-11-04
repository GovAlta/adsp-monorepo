import * as projectPlanner from './index';
import { ProjectPlannerRouter } from './routers';

jest.mock('./routers', () => ({
  ProjectPlannerRouter: jest.fn(),
}));

describe('project-planner barrel', () => {
  it('re-exports ProjectPlannerRouter from the routers module', () => {
    expect(projectPlanner.ProjectPlannerRouter).toBe(ProjectPlannerRouter);
  });

  it('does not expose other runtime exports', () => {
    expect(projectPlanner).not.toHaveProperty('ProjectPlanner');
  });
});
