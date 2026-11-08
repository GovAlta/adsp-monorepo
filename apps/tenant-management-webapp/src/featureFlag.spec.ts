import { defaultFeaturesVisible, externalServices, serviceVariables } from './featureFlag';

describe('serviceVariables', () => {
  it('returns only the services enabled by the merged flags', () => {
    const names = serviceVariables({ SharePoint: true }).map((service) => service.name);

    expect(names).toContain('SharePoint');
    expect(names).not.toContain('Task');
  });

  it('lets caller flags override the defaults in both directions', () => {
    const names = serviceVariables({ SharePoint: true, Value: false }).map((service) => service.name);

    expect(names).toContain('SharePoint');
    expect(names).not.toContain('Value');
  });

  it('sorts the enabled services by name', () => {
    const names = serviceVariables({ SharePoint: true, Task: true }).map((service) => service.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(names.indexOf('SharePoint')).toBe(names.indexOf('Script') + 1);
  });

  it('does not mutate the underlying service list when sorting', () => {
    const first = serviceVariables({ SharePoint: true }).map((service) => service.name);
    const second = serviceVariables({ SharePoint: true }).map((service) => service.name);

    expect(second).toEqual(first);
  });
});

describe('sharepoint service flag', () => {
  it('is hidden by default', () => {
    expect(defaultFeaturesVisible.SharePoint).toBe(false);
    expect(serviceVariables().find((service) => service.name === 'SharePoint')).toBeUndefined();
  });

  it('is an alpha service linking to the sharepoint overview page', () => {
    const sharePoint = serviceVariables({ SharePoint: true }).find((service) => service.name === 'SharePoint');

    expect(sharePoint).toMatchObject({ link: 'services/sharepoint', alpha: true, beta: false });
  });
});

describe('externalServices', () => {
  const serviceUrls = { projectPlannerWebApp: 'https://planner.example' };

  it('hides the project planner by default', () => {
    expect(defaultFeaturesVisible['Project Planner']).toBe(false);
    expect(externalServices(undefined, serviceUrls)).toEqual([]);
  });

  it('links the project planner to its own app when the flag is on', () => {
    expect(externalServices({ 'Project Planner': true }, serviceUrls)).toEqual([
      { name: 'Project Planner', url: 'https://planner.example', beta: true },
    ]);
  });

  it('leaves the project planner out when its app URL is unknown', () => {
    expect(externalServices({ 'Project Planner': true }, {})).toEqual([]);
  });
});
