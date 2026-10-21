import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { catalogServices, driftMessage, registeredServices, unmappedServices } from './drift';

describe('catalogServices', () => {
  it('reads platform keys and namespace-level keys as service names', () => {
    expect(catalogServices(['platform:form-service', 'audit-service'])).toEqual(['form-service', 'audit-service']);
  });

  it('ignores keys outside the platform namespace', () => {
    expect(catalogServices(['tenant:intake'])).toEqual([]);
  });
});

describe('unmappedServices', () => {
  it('keeps only services that are neither mapped nor excluded', () => {
    expect(unmappedServices(['form-service', 'token-handler', 'sharepoint-service'])).toEqual(['sharepoint-service']);
  });
});

describe('driftMessage', () => {
  it('names the services and where to update the map', () => {
    expect(driftMessage(['sharepoint-service', 'pii-service'])).toBe(
      'ADSP component map is out of date: sharepoint-service, pii-service. ' +
        'Update apps/project-planner-service/src/planner/components/adsp-map.ts. ' +
        'See "Updating the ADSP component map" in the planner README.',
    );
  });
});

describe('registeredServices', () => {
  let apps: string;

  const app = (name: string, file: string, content: string) => {
    mkdirSync(join(apps, name, 'src'), { recursive: true });
    writeFileSync(join(apps, name, 'src', file), content);
  };

  beforeEach(() => {
    apps = mkdtempSync(join(tmpdir(), 'planner-apps-'));
  });

  afterEach(() => {
    rmSync(apps, { recursive: true, force: true });
  });

  it('lists apps that register a configuration schema in main.ts or app.ts', () => {
    app('form-service', 'main.ts', 'initializePlatform({\n      configuration: {\n        description: "Forms",\n        schema: configurationSchema,\n      },\n});');
    app('audit-service', 'app.ts', 'initializePlatform({\n      configuration: {\n        useNamespace: true,\n        schema: auditSchema,\n      },\n});');

    expect(registeredServices(apps).sort()).toEqual(['audit-service', 'form-service']);
  });

  it('ignores configuration an app writes for other services', () => {
    app('task-service', 'main.ts', 'serviceConfigurations: [{\n  configuration: {\n    [`${serviceId}:v1`]: { schema: x },\n  },\n}]');

    expect(registeredServices(apps)).toEqual([]);
  });

  it('ignores apps without a main.ts or app.ts', () => {
    mkdirSync(join(apps, 'form-app', 'src'), { recursive: true });

    expect(registeredServices(apps)).toEqual([]);
  });
});
