import { PlannerServiceRoles } from './roles';

describe('PlannerServiceRoles', () => {
  it('defines the admin role', () => {
    expect(PlannerServiceRoles.Admin).toBe('planner-admin');
  });

  it('defines the user role', () => {
    expect(PlannerServiceRoles.User).toBe('planner-user');
  });
});
