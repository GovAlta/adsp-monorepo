import { recommendedServices } from '../blueprint';
import { getSpecialist } from '../specialists';
import { BlueprintComponent, SolutionState } from '../types';
import { ADSP_COMPONENT_MAP, docsUrl, EXCLUDED_SERVICES } from './adsp-map';

// An ADSP component as drafted by the model or the rules, before its setup is resolved.
export interface ComponentDraft {
  service: string;
  type?: string;
  name: string;
  purpose: string;
  dependsOn?: string[];
  openDecisions?: string[];
}

export interface ComponentOptions {
  drafts?: ComponentDraft[];
  // Keys of the live configuration catalog; undefined when it could not be read.
  catalogKeys?: string[];
  integrations?: string[];
}

type Unordered = Omit<BlueprintComponent, 'order'>;

const slug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function ruleDrafts(state: SolutionState, title: string): ComponentDraft[] {
  return recommendedServices(state)
    .filter((rec) => ADSP_COMPONENT_MAP[rec.service])
    .map((rec) => {
      const specialist = getSpecialist(rec.service);
      return {
        service: rec.service,
        name: `${ADSP_COMPONENT_MAP[rec.service].type} for ${title}`,
        purpose: rec.reason,
        dependsOn: specialist?.dependsOn,
        openDecisions: specialist?.questions,
      };
    });
}

function adspComponent(draft: ComponentDraft, keys?: string[]): Unordered | undefined {
  const base = {
    service: draft.service,
    name: draft.name,
    purpose: draft.purpose,
    dependsOn: draft.dependsOn || [],
    openDecisions: draft.openDecisions || [],
    target: 'adsp' as const,
  };
  const mapped = ADSP_COMPONENT_MAP[draft.service];
  if (mapped) {
    return {
      ...base,
      type: draft.type || mapped.type,
      setup: { where: mapped.where, docs: mapped.docs ?? docsUrl(draft.service), schemaKey: mapped.schemaKey, how: mapped.how },
    };
  }

  // A live service missing from the map is still set up through tenant configuration.
  const schemaKey = keys?.find((key) => key === `platform:${draft.service}` || key === draft.service);
  if (!schemaKey || EXCLUDED_SERVICES.includes(draft.service)) return undefined;
  return {
    ...base,
    type: draft.type || `${draft.service} configuration`,
    setup: {
      where: ADSP_COMPONENT_MAP['configuration-service'].where,
      docs: docsUrl('configuration-service'),
      schemaKey,
      how: `Configure under ${schemaKey} in tenant configuration.`,
    },
  };
}

function keycloakComponents(state: SolutionState, app: string, services: string[]): Unordered[] {
  const keycloak = (type: string, name: string, purpose: string, how: string): Unordered => ({
    service: 'keycloak',
    type,
    name,
    purpose,
    dependsOn: [],
    openDecisions: [],
    target: 'keycloak',
    setup: { where: 'Keycloak admin console, tenant realm', docs: docsUrl('access-service'), how },
  });
  const actors = state.concepts.filter((c) => c.type === 'actor').map((c) => c.name);
  const roles = actors.length > 0 ? [...new Set(actors.map(slug))] : ['solution-user'];

  return [
    ...roles.map((role) => keycloak('Role', role, `Grants ${role} users access to the solution.`, `Add the ${role} role and assign it to users.`)),
    keycloak('Client', `${app}-app`, 'Signs users in to the web app.', 'Add a public OpenID Connect client with the web app redirect URIs.'),
    keycloak(
      'Service account',
      `${app}-service`,
      'Lets the backend call ADSP services.',
      `Add a confidential client with service accounts enabled and grant it roles on ${services.join(', ')}.`,
    ),
  ];
}

function openshiftComponents(app: string, integrations: string[]): Unordered[] {
  const openshift = (type: string, name: string, purpose: string, how: string): Unordered => ({
    service: 'openshift',
    type,
    name,
    purpose,
    dependsOn: [],
    openDecisions: [],
    target: 'openshift',
    setup: { where: 'OpenShift project for the solution', docs: 'https://docs.openshift.com/', how },
  });

  return [
    openshift(
      'Deployment',
      app,
      'Runs the solution backend.',
      'Deploy the backend with the environment variables KEYCLOAK_ROOT_URL, DIRECTORY_URL, CLIENT_ID and CLIENT_SECRET.',
    ),
    openshift('Secret', `${app}-secrets`, 'Holds the service account client secret.', 'Create a secret with CLIENT_SECRET and reference it from the Deployment.'),
    ...(integrations.length > 0
      ? [
          openshift(
            'ConfigMap',
            `${app}-config`,
            `Holds non-secret settings for ${integrations.join(', ')}.`,
            'Create a config map with the integration endpoints and reference it from the Deployment.',
          ),
        ]
      : []),
  ];
}

// Everything to create or configure so the solution can run: ADSP first, then Keycloak, then OpenShift.
export function buildComponents(state: SolutionState, options: ComponentOptions = {}): BlueprintComponent[] {
  const title = state.hypotheses[0]?.title || 'the solution';
  const app = slug(title) || 'solution';
  const drafts = options.drafts?.length ? options.drafts : ruleDrafts(state, title);
  const adsp = drafts.map((draft) => adspComponent(draft, options.catalogKeys)).filter(Boolean);
  const services = [...new Set(adsp.map((c) => c.service))];

  return [...adsp, ...keycloakComponents(state, app, services), ...openshiftComponents(app, options.integrations || [])].map(
    (component, i) => ({ order: i + 1, ...component }),
  );
}
