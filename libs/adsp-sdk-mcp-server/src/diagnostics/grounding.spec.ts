import { readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';
import type { ApiServiceSummary } from '../api-specs/apiSpecsRepository';
import { DocsRepository } from '../docs/docsRepository';
import { diagnose } from './diagnose';
import { DIAGNOSIS_RULES } from './diagnoses';
import { AUDIENCE_MAPPER_STEP, BOTH_STEPS_REQUIRED, SERVICE_ACCOUNT_ROLE_STEP } from './keycloakSteps';

const SDK_SRC_PATH = resolve(__dirname, '../../../adsp-service-sdk/src');
const DOCS_ROOT = resolve(__dirname, '../../../../docs');

function sdkSources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return sdkSources(path);
    }
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [readFileSync(path, 'utf8')] : [];
  });
}

const SERVICES: ApiServiceSummary[] = [
  { app: 'file-service', urn: 'urn:ads:platform:file-service', name: 'File service', operations: 1, file: 'f.json' },
];

const SERVICE_CALL_SYMPTOMS = [
  '401',
  '403',
  '401 calling file-service',
  '403 calling file-service',
  '401 calling the thing',
  'my endpoint returns 401 to callers',
  'Unauthorized calling urn:ads:platform:file-service',
  'User sa (ID: x) not permitted to upload file',
];

const oneLine = (text: string) => text.replace(/\s*\n\s*/g, ' ');

describe('diagnosis grounding', () => {
  it('every quoted SDK message exists in the SDK source', () => {
    const sources = sdkSources(SDK_SRC_PATH);
    const missing = DIAGNOSIS_RULES.flatMap(({ id, messageFragments }) =>
      messageFragments
        .filter((fragment) => !sources.some((source) => source.includes(fragment)))
        .map((fragment) => ({ id, fragment })),
    );

    expect(sources.length).toBeGreaterThan(20);
    expect(missing).toEqual([]);
  });

  it('every source page reads through read_adsp_doc', () => {
    const docs = new DocsRepository(DOCS_ROOT);
    const unreadable = DIAGNOSIS_RULES.flatMap(({ id, sources }) =>
      sources.filter((path) => !docs.read(path)).map((path) => ({ id, path })),
    );

    expect(unreadable).toEqual([]);
  });

  it.each(SERVICE_CALL_SYMPTOMS)('the service-call diagnoses never give one Keycloak change alone: %s', (symptom) => {
    const [top] = diagnose(symptom, SERVICES);
    const fix = top.causes.map(({ fix }) => fix).join(' ');

    expect(['service-call-401', 'service-call-403']).toContain(top.id);
    expect(fix).toContain(AUDIENCE_MAPPER_STEP.title);
    expect(fix).toContain(SERVICE_ACCOUNT_ROLE_STEP.title);
    expect(fix).toContain(oneLine(BOTH_STEPS_REQUIRED));
  });
});
