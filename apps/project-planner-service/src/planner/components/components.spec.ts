import { getSpecialist } from '../specialists';
import { BusinessConcept, SolutionState } from '../types';
import { ADSP_COMPONENT_MAP, docsUrl } from './adsp-map';
import { buildComponents } from './components';

const actor = (name: string): BusinessConcept => ({ id: name, type: 'actor', name, source: 'extracted' });

const state = (services: string[] = ['form-service', 'file-service'], actors = ['Grant officer', 'Applicant']): SolutionState => ({
  problemStatement: 'Residents apply for grants.',
  concepts: actors.map(actor),
  decisions: [],
  questions: [],
  patternMatches: [],
  hypotheses: [
    {
      id: 'h-1',
      title: 'Grant case workflow',
      patternId: 'case-management',
      confidence: 'high',
      rationale: 'Applications are reviewed as cases.',
      recommendations: services.map((service, i) => ({ service, reason: `Reason ${service}`, order: i + 1 })),
      assumptions: [],
      unknowns: [],
    },
  ],
  specialists: [],
  nextSteps: [],
});

const adsp = (components: ReturnType<typeof buildComponents>) => components.filter((c) => c.target === 'adsp');
const byTarget = (components: ReturnType<typeof buildComponents>, target: string) => components.filter((c) => c.target === target);

describe('buildComponents', () => {
  describe('rules mode', () => {
    it('adds one ADSP component per mapped recommended service, in order', () => {
      expect(adsp(buildComponents(state())).map((c) => c.service)).toEqual(['form-service', 'file-service']);
    });

    it('names the component after its type and the solution title', () => {
      const [form] = buildComponents(state());

      expect(form).toMatchObject({ type: 'Form definition', name: 'Form definition for Grant case workflow', purpose: 'Reason form-service' });
    });

    it('seeds open decisions from the specialist questions', () => {
      const [form] = buildComponents(state());

      expect(form.openDecisions).toEqual(getSpecialist('form-service').questions);
    });

    it('depends on the services the specialist depends on', () => {
      const [form] = buildComponents(state());

      expect(form.dependsOn).toEqual(['file-service']);
    });

    it('takes the setup from the component map', () => {
      const [form] = buildComponents(state());
      const mapped = ADSP_COMPONENT_MAP['form-service'];

      expect(form.setup).toEqual({ where: mapped.where, docs: docsUrl('form-service'), schemaKey: mapped.schemaKey, how: mapped.how });
    });

    it('skips recommended services that are not in the map', () => {
      expect(adsp(buildComponents(state(['custom-service'])))).toEqual([]);
    });

    it('numbers every component in order from 1', () => {
      const components = buildComponents(state());

      expect(components.map((c) => c.order)).toEqual(components.map((_, i) => i + 1));
    });
  });

  describe('drafted components', () => {
    it('uses the drafts instead of the rule-based ADSP components', () => {
      const components = buildComponents(state(), {
        drafts: [{ service: 'form-service', name: 'Grant application', purpose: 'Collects applications', openDecisions: ['Allow drafts?'] }],
      });

      expect(adsp(components)).toEqual([
        expect.objectContaining({ type: 'Form definition', name: 'Grant application', purpose: 'Collects applications', openDecisions: ['Allow drafts?'] }),
      ]);
    });

    it('keeps the drafted type and dependencies when supplied', () => {
      const [form] = buildComponents(state(), {
        drafts: [{ service: 'form-service', type: 'Intake form', name: 'Grant application', purpose: 'p', dependsOn: ['Grant files'] }],
      });

      expect(form).toMatchObject({ type: 'Intake form', dependsOn: ['Grant files'] });
    });

    it('sets up an unmapped live service through tenant configuration', () => {
      const [sharepoint] = buildComponents(state(), {
        drafts: [{ service: 'sharepoint-service', name: 'Case library', purpose: 'Stores case files' }],
        catalogKeys: ['platform:sharepoint-service'],
      });

      expect(sharepoint).toMatchObject({
        type: 'sharepoint-service configuration',
        setup: {
          where: ADSP_COMPONENT_MAP['configuration-service'].where,
          docs: docsUrl('configuration-service'),
          schemaKey: 'platform:sharepoint-service',
          how: 'Configure under platform:sharepoint-service in tenant configuration.',
        },
      });
    });

    it('drops a drafted service that is neither mapped nor live', () => {
      const components = buildComponents(state(), { drafts: [{ service: 'made-up-service', name: 'X', purpose: 'Y' }], catalogKeys: [] });

      expect(adsp(components)).toEqual([]);
    });

    it('drops a drafted service that is excluded even when it is live', () => {
      const components = buildComponents(state(), {
        drafts: [{ service: 'tenant-service', name: 'X', purpose: 'Y' }],
        catalogKeys: ['platform:tenant-service'],
      });

      expect(adsp(components)).toEqual([]);
    });

    it('links to the ADSP services index for a mapped service without a docs page', () => {
      const [script] = buildComponents(state(), { drafts: [{ service: 'script-service', name: 'Score', purpose: 'Scores applications' }] });

      expect(script.setup.docs).toBe('https://govalta.github.io/adsp-monorepo/services/services.html');
    });
  });

  describe('Keycloak', () => {
    it('adds a role for each actor', () => {
      const roles = byTarget(buildComponents(state()), 'keycloak').filter((c) => c.type === 'Role');

      expect(roles.map((r) => r.name)).toEqual(['grant-officer', 'applicant']);
    });

    it('adds a single user role when there are no actors', () => {
      const roles = byTarget(buildComponents(state(undefined, [])), 'keycloak').filter((c) => c.type === 'Role');

      expect(roles.map((r) => r.name)).toEqual(['solution-user']);
    });

    it('adds the app client and a service account', () => {
      const types = byTarget(buildComponents(state()), 'keycloak').map((c) => c.type);

      expect(types).toEqual(expect.arrayContaining(['Client', 'Service account']));
    });

    it('lists the ADSP services the service account needs roles on', () => {
      const account = buildComponents(state()).find((c) => c.type === 'Service account');

      expect(account.setup.how).toContain('form-service, file-service');
    });
  });

  describe('OpenShift', () => {
    it('adds a Deployment and a Secret', () => {
      expect(byTarget(buildComponents(state()), 'openshift').map((c) => c.type)).toEqual(['Deployment', 'Secret']);
    });

    it('names the environment variables the Deployment needs', () => {
      const deployment = buildComponents(state()).find((c) => c.type === 'Deployment');

      expect(deployment.setup.how).toContain('KEYCLOAK_ROOT_URL, DIRECTORY_URL, CLIENT_ID');
    });

    it('adds a ConfigMap when there is non-secret configuration for integrations', () => {
      const configMap = buildComponents(state(), { integrations: ['Finance system'] }).find((c) => c.type === 'ConfigMap');

      expect(configMap.purpose).toContain('Finance system');
    });
  });
});
