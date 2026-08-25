import { defaultFeaturesVisible, serviceVariables } from './featureFlag';

describe('serviceVariables', () => {
  it('returns only the services enabled by the merged flags', () => {
    const names = serviceVariables({ Secret: true }).map((service) => service.name);

    expect(names).toContain('Secret');
    expect(names).not.toContain('SharePoint');
  });

  it('lets caller flags override the defaults in both directions', () => {
    const names = serviceVariables({ Secret: true, Value: false }).map((service) => service.name);

    expect(names).toContain('Secret');
    expect(names).not.toContain('Value');
  });

  it('sorts the enabled services by name', () => {
    const names = serviceVariables({ Secret: true, SharePoint: true, Task: true }).map((service) => service.name);

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
    expect(names.indexOf('Secret')).toBe(names.indexOf('Script') + 1);
    expect(names.indexOf('SharePoint')).toBe(names.indexOf('Secret') + 1);
  });

  it('does not mutate the underlying service list when sorting', () => {
    const first = serviceVariables({ Secret: true }).map((service) => service.name);
    const second = serviceVariables({ Secret: true }).map((service) => service.name);

    expect(second).toEqual(first);
  });
});

describe('secret service flag', () => {
  it('is hidden by default', () => {
    expect(defaultFeaturesVisible.Secret).toBe(false);
    expect(serviceVariables().find((service) => service.name === 'Secret')).toBeUndefined();
  });

  it('is an alpha service linking to the secret overview page', () => {
    const secret = serviceVariables({ Secret: true }).find((service) => service.name === 'Secret');

    expect(secret).toMatchObject({ link: 'services/secret', alpha: true, beta: false });
  });
});
