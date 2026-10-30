import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { ADSP_COMPONENT_MAP, EXCLUDED_SERVICES } from './adsp-map';

// A flat `configuration: { ... schema: ... }` block; writes to other services nest a `{` before any schema.
const REGISTERS_SCHEMA = /\bconfiguration:\s*\{[^{}]*\bschema\s*:/;

// Catalog keys are `platform:<service>`, or a bare `<service>` for services that use their own namespace.
export const catalogServices = (keys: string[]): string[] =>
  keys.flatMap((key) => (key.startsWith('platform:') ? [key.slice('platform:'.length)] : key.includes(':') ? [] : [key]));

export const unmappedServices = (services: string[]): string[] =>
  services.filter((service) => !ADSP_COMPONENT_MAP[service] && !EXCLUDED_SERVICES.includes(service));

export const driftMessage = (services: string[]): string =>
  `ADSP component map is out of date: ${services.join(', ')}. ` +
  'Update apps/project-planner-service/src/planner/components/adsp-map.ts. ' +
  'See "Updating the ADSP component map" in the planner README.';

// Apps in the monorepo that register a configuration schema; used by the local runner, which has no live catalog.
export function registeredServices(appsDir: string): string[] {
  return readdirSync(appsDir).filter((app) =>
    ['main.ts', 'app.ts'].some((file) => {
      const path = join(appsDir, app, 'src', file);
      return existsSync(path) && REGISTERS_SCHEMA.test(readFileSync(path, 'utf8'));
    }),
  );
}
