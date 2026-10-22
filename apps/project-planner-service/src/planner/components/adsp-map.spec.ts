import { existsSync } from 'fs';
import { resolve } from 'path';
import { SPECIALISTS } from '../specialists';
import { ADSP_COMPONENT_MAP, docsUrl, EXCLUDED_SERVICES } from './adsp-map';

const docsPages = resolve(__dirname, '../../../../../docs/services');

describe('ADSP component map', () => {
  it.each(SPECIALISTS.map((s) => s.service))('maps the %s specialist', (service) => {
    expect(ADSP_COMPONENT_MAP[service]).toBeDefined();
  });

  it.each(['audit-service', 'directory-service', 'export-service', 'pii-service', 'script-service', 'token-handler', 'verify-service'])(
    'maps %s because an app can be built on it',
    (service) => {
      expect(ADSP_COMPONENT_MAP[service]).toBeDefined();
    },
  );

  it('excludes only the services an app cannot be built on', () => {
    expect(EXCLUDED_SERVICES).toEqual(['tenant-management-api', 'tenant-service', 'project-planner-service']);
  });

  it('does not both map and exclude a service', () => {
    expect(EXCLUDED_SERVICES.filter((s) => ADSP_COMPONENT_MAP[s])).toEqual([]);
  });

  it.each(['form-service', 'audit-service'])('keys the %s schema by its own namespace', (service) => {
    expect(ADSP_COMPONENT_MAP[service].schemaKey).toBe(service);
  });

  it.each(Object.keys(ADSP_COMPONENT_MAP).filter((service) => !ADSP_COMPONENT_MAP[service].docs))(
    'has a docs page for %s',
    (service) => {
      expect(existsSync(resolve(docsPages, `${service}.md`))).toBe(true);
    },
  );

  it('links to the service page in the ADSP docs', () => {
    expect(docsUrl('form-service')).toBe('https://govalta.github.io/adsp-monorepo/services/form-service.html');
  });
});
