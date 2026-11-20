import type { ApiServiceSummary } from '../api-specs/apiSpecsRepository';
import { diagnose, extractSignals } from './diagnose';
import { DIAGNOSIS_RULES } from './diagnoses';
import { AUDIENCE_MAPPER_STEP, BOTH_STEPS_REQUIRED, SERVICE_ACCOUNT_ROLE_STEP } from './keycloakSteps';

const service = (app: string, name: string, urn = `urn:ads:platform:${app}`): ApiServiceSummary => ({
  app,
  urn,
  name,
  operations: 1,
  file: `${app}.json`,
});

const SERVICES = [
  service('file-service', 'File service'),
  service('pdf-service', 'PDF service'),
  service('configuration-service', 'Configuration service'),
  service('tenant-management-api', 'Tenant service', 'urn:ads:platform:tenant-service'),
];

const oneLine = (text: string) => text.replace(/\s*\n\s*/g, ' ');
const fixText = (symptom: string) =>
  diagnose(symptom, SERVICES)[0]
    .causes.map(({ fix }) => fix)
    .join(' ');

const CANONICAL_SYMPTOMS: Record<string, string> = {
  'service-call-401': '401 calling file-service',
  'service-call-403': '403 calling file-service',
  'configuration-undefined': 'req.getConfiguration() returns undefined',
  'tenant-not-resolved': 'req.tenant is undefined',
  'directory-lookup-failed': 'Failed to find directory entry for urn:ads:platform:pdf-service',
  'token-request-failed': 'Error encountered retrieving access token',
};

describe('diagnose', () => {
  it('names both Keycloak changes for a 401 calling file-service', () => {
    const [top] = diagnose('401 calling file-service', SERVICES);
    const fix = fixText('401 calling file-service');
    const audienceStep = fix.slice(
      fix.indexOf(AUDIENCE_MAPPER_STEP.title),
      fix.indexOf(SERVICE_ACCOUNT_ROLE_STEP.title),
    );
    const roleStep = fix.slice(fix.indexOf(SERVICE_ACCOUNT_ROLE_STEP.title));

    expect(top.id).toBe('service-call-401');
    expect(top.match).toBe('strong');
    expect(audienceStep).toContain('urn:ads:platform:file-service');
    expect(roleStep).toContain('urn:ads:platform:file-service');
    expect(fix).toContain(oneLine(BOTH_STEPS_REQUIRED));
    expect(top.followUp?.[0]).toMatchObject({ tool: 'list_service_roles', needsSignIn: true });
  });

  it('points configuration-undefined at registration and the schema tool', () => {
    const [top] = diagnose('req.getConfiguration() returns undefined', SERVICES);

    expect(top.id).toBe('configuration-undefined');
    expect(top.causes[0].cause).toMatch(/regist/i);
    expect(top.followUp?.map(({ tool }) => tool)).toContain('get_service_configuration_schema');
  });

  it('names a follow-up wherever one applies', () => {
    const withoutFollowUp = new Set(['tenant-not-resolved', 'token-request-failed']);

    const tops = DIAGNOSIS_RULES.map((rule) => ({ rule, top: diagnose(CANONICAL_SYMPTOMS[rule.id], SERVICES)[0] }));
    const missingFollowUp = tops
      .filter(({ rule, top }) => !withoutFollowUp.has(rule.id) && !top.followUp?.length)
      .map(({ rule }) => rule.id);

    expect(tops.map(({ top }) => top.id)).toEqual(DIAGNOSIS_RULES.map(({ id }) => id));
    expect(missingFollowUp).toEqual([]);
  });

  it('keeps the rules in the order ties fall back to', () => {
    expect(DIAGNOSIS_RULES.map(({ id }) => id)).toEqual([
      'service-call-401',
      'service-call-403',
      'configuration-undefined',
      'tenant-not-resolved',
      'directory-lookup-failed',
      'token-request-failed',
    ]);
  });

  it('matches each SDK message exactly', () => {
    for (const rule of DIAGNOSIS_RULES) {
      for (const fragment of rule.messageFragments) {
        const [top] = diagnose(fragment, SERVICES);
        expect({ fragment, id: top?.id, match: top?.match }).toEqual({ fragment, id: rule.id, match: 'exact' });
      }
    }
  });

  it('matches an SDK message inside pasted text', () => {
    const trace = [
      'Error: Failed to find directory entry for urn:ads:platform:pdf-service:v1',
      '    at ServiceDirectoryImpl.getServiceUrl (node_modules/@abgov/adsp-service-sdk/directory/serviceDirectory.js:117:15)',
      '    at async generatePdf (apps/my-service/src/pdf.ts:22:9)',
    ].join('\n');

    const [top] = diagnose(trace, SERVICES);

    expect(top).toMatchObject({ id: 'directory-lookup-failed', match: 'exact' });
    expect(extractSignals(trace, SERVICES).target?.urn).toBe('urn:ads:platform:pdf-service');
  });

  it('returns a bare 401 as weak with the direction check', () => {
    const results = diagnose('401', SERVICES);

    expect(results.map(({ id }) => id)).toEqual(['service-call-401']);
    expect(results[0].match).toBe('weak');
    expect(results[0].check).toMatch(/received/i);
    expect(results[0].check).toMatch(/returned/i);
  });

  it('puts the fix on the caller when your endpoint returned the 401', () => {
    const fix = fixText('my endpoint returns 401 to callers');

    expect(fix).toContain("caller's Keycloak client");
    expect(fix).toContain("your service's URN");
    expect(fix).toContain(AUDIENCE_MAPPER_STEP.title);
    expect(fix).toContain(SERVICE_ACCOUNT_ROLE_STEP.title);
  });

  it('matches the not-permitted message as a 403', () => {
    expect(diagnose('User sa (ID: x) not permitted to upload file', SERVICES)[0]).toMatchObject({
      id: 'service-call-403',
      match: 'exact',
    });
  });

  it('uses example wording when no service is named', () => {
    expect(fixText('401 calling the thing')).toContain('for example `urn:ads:platform:file-service`');
  });

  it.each(['401 calling profile-service-x', '401 calling files', '401 calling file-servce'])(
    'recognises services only as whole known names: %s',
    (symptom) => {
      expect(extractSignals(symptom, SERVICES).target).toBeUndefined();
    },
  );

  it('maps an app to its URN from the index', () => {
    expect(extractSignals('401 calling tenant-management-api', SERVICES).target).toEqual({
      urn: 'urn:ads:platform:tenant-service',
      app: 'tenant-management-api',
    });
  });

  it('recognises a service by its display name', () => {
    expect(extractSignals('403 from the PDF service', SERVICES).target?.urn).toBe('urn:ads:platform:pdf-service');
  });

  it('ranks several matching diagnoses', () => {
    const results = diagnose('401 calling configuration-service and getConfiguration returns undefined', SERVICES);
    const ids = results.map(({ id }) => id);

    expect(ids).toContain('service-call-401');
    expect(ids).toContain('configuration-undefined');
    expect(ids[0]).toBe('service-call-401');
    expect(results.length).toBeLessThanOrEqual(3);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(['token', 'tenant', 'kubernetes pod crashloop', 'configuration'])(
    'does not match a lone generic word: %s',
    (symptom) => {
      expect(diagnose(symptom, SERVICES)).toEqual([]);
    },
  );

  it('works with no service index', () => {
    expect(diagnose('401 calling urn:ads:platform:file-service', [])[0].causes[0].fix).toContain(
      'urn:ads:platform:file-service',
    );
  });
});
