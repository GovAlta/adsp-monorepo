import * as models from './models';
import type { ConfigState, ServiceUrls } from './models';

describe('config models', () => {
  it('initialises config state as an empty object', () => {
    expect(models.CONFIG_INIT).toEqual({});
  });

  it('does not expose a runtime export for the ConfigState type', () => {
    expect(models).not.toHaveProperty('ConfigState');
  });

  it('allows service urls to include the project planner service api url', () => {
    const serviceUrls = { projectPlannerServiceApiUrl: 'https://project-planner-service.example' } as ServiceUrls;
    const state: ConfigState = { serviceUrls };

    expect(state.serviceUrls.projectPlannerServiceApiUrl).toBe('https://project-planner-service.example');
  });
});
