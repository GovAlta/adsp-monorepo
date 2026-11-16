import type { ServiceDirectory, User } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import {
  accessClientSetupValuesSchema,
  accessClientSummarySchema,
  accessServiceCheckSchema,
  accessTokenPreviewSchema,
  accessUserRolesSchema,
  checkClientSetup,
  checkClientUrl,
  checkServiceRoles,
  clientFindingSchema,
  clientUrlCheckSchema,
  createProblem,
  DEFAULT_TOKEN_SCOPE,
  isUserInspectionAllowed,
  readSecretCreatedAt,
  toAccessUserRoles,
  toClientDetails,
  toClientSetupValues,
  toClientSummary,
  toProblemFields,
  toTokenPreview,
} from '../agents/access/discovery';
import { asRecord, optionalBoolean, optionalString, recordList } from '../agents/access/discovery/values';
import { clientIdSchema, FoundClient, toClientFailureFields } from './accessClientLookup';
import {
  describeClientLookup,
  describeClientSummary,
  describeFindings,
  describeServiceAccount,
  describeSetupValues,
  describeTokenPreview,
  describeUrlCheck,
} from './accessClientModelOutput';
import { createModelOutput, describeNotes, shortTime } from './accessModelOutput';
import { AccessReaders, createAccessReaders, resolveServiceDefinitions } from './accessReaders';
import { describeServiceChecks, describeUserRoles } from './accessRoleModelOutput';
import {
  accessEnvironmentSchema,
  accessRealmSchema,
  accessResultFields,
  createAccessToolRunner,
  createInspectionTargetResolver,
  describeRealm,
  InspectionTarget,
  toTargetProblemFields,
} from './accessToolSupport';
import { describeMatch, toLookupFailureFields, userTextSchema } from './accessUserLookup';

const MAX_URL_LENGTH = 2048;
const MAX_SERVICE_TEXT_LENGTH = 255;
// Scope names are letters, digits and a few separators; anything else is refused rather than sent to Keycloak.
const SCOPE_PATTERN = /^[\w:.\-/]+( [\w:.\-/]+)*$/;

const clientFields = {
  ...accessResultFields,
  environment: accessEnvironmentSchema.optional(),
  realm: accessRealmSchema.optional(),
  clientId: z.string(),
  suggestions: z.array(z.string()).optional(),
};

const setupOutputSchema = z.object({
  ...clientFields,
  client: accessClientSummarySchema.optional(),
  findings: z.array(clientFindingSchema).optional(),
  setup: accessClientSetupValuesSchema.optional(),
  secretCreatedAt: z.string().optional(),
});

const urlInputSchema = z.object({
  clientId: clientIdSchema,
  url: z
    .string()
    .trim()
    .min(1)
    .max(MAX_URL_LENGTH)
    .describe("The full web address from the user's app as they gave it, e.g. https://my-app.alberta.ca/callback."),
});

const urlOutputSchema = z.object({ ...clientFields, check: clientUrlCheckSchema.optional() });

const tokenInputSchema = z.object({
  clientId: clientIdSchema.describe('The client ID of the app whose token to preview.'),
  user: userTextSchema
    .optional()
    .describe("The person whose token to preview, as the user named them. Omit for the app's service account."),
  scope: z
    .string()
    .trim()
    .max(MAX_SERVICE_TEXT_LENGTH)
    .regex(SCOPE_PATTERN)
    .optional()
    .describe('Extra optional client scopes to request, space-separated; openid is always included.'),
});

const tokenOutputSchema = z.object({
  ...clientFields,
  search: z.string().optional(),
  preview: accessTokenPreviewSchema.optional(),
});

const serviceAccountInputSchema = z.object({
  clientId: clientIdSchema,
  service: z
    .string()
    .trim()
    .min(1)
    .max(MAX_SERVICE_TEXT_LENGTH)
    .optional()
    .describe('The service it needs to call, as the user named it, e.g. "form service".'),
});

const serviceAccountOutputSchema = z.object({
  ...clientFields,
  serviceAccount: z
    .object({ username: z.string(), enabled: z.boolean().optional(), secretCreatedAt: z.string().optional() })
    .optional(),
  roles: accessUserRolesSchema.optional(),
  services: z.array(accessServiceCheckSchema).optional(),
  setup: accessClientSetupValuesSchema.optional(),
  notes: z.array(z.string()).optional(),
});

type SetupOutput = z.infer<typeof setupOutputSchema>;
type UrlOutput = z.infer<typeof urlOutputSchema>;
type TokenOutput = z.infer<typeof tokenOutputSchema>;
type ServiceAccountOutput = z.infer<typeof serviceAccountOutputSchema>;

interface AccessClientCheckToolsProps {
  logger: Logger;
  directory: ServiceDirectory;
  accessServiceUrl: URL;
  readers?: AccessReaders;
}

function parseAppUrl(text: string): URL | undefined {
  try {
    const url = new URL(text);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : undefined;
  } catch {
    return undefined;
  }
}

function countClientRoles(mappings: Record<string, unknown>): number {
  return Object.values(asRecord(mappings.clientMappings)).reduce<number>(
    (count, mapping) => count + recordList(asRecord(mapping).mappings).length,
    0,
  );
}

export function createAccessClientCheckTools({
  logger,
  directory,
  accessServiceUrl,
  readers,
}: AccessClientCheckToolsProps) {
  const resolveInspectionTarget = createInspectionTargetResolver({ directory, accessServiceUrl });
  const resolvePeopleTarget = createInspectionTargetResolver({
    directory,
    accessServiceUrl,
    environmentRule: { isAllowed: isUserInspectionAllowed, reason: 'USER_INSPECTION_NOT_ALLOWED' },
  });
  const access = readers ?? createAccessReaders({ directory });
  const { clientReader, userReader, clientLookup, userLookup, roleAssignments } = access;
  const run = createAccessToolRunner({ logger, logContext: 'AccessClientCheckTools', toolKind: 'Access client tool' });

  type ClientTarget =
    | { ok: true; target: InspectionTarget; found: FoundClient }
    | { ok: false; output: z.infer<z.ZodObject<typeof clientFields>> };

  async function findClient(user: User | undefined, clientId: string, people = false): Promise<ClientTarget> {
    const resolved = await (people ? resolvePeopleTarget : resolveInspectionTarget)(user);
    if (resolved.ok === false) {
      return { ok: false, output: { ...toTargetProblemFields(resolved), clientId } };
    }
    const found = await clientLookup.lookupClient(resolved.value, clientId);
    if (found.ok === false) {
      return { ok: false, output: toClientFailureFields(resolved.value, clientId, found.failure) };
    }
    return { ok: true, target: resolved.value, found: found.value };
  }

  /**
   * Reads the internal ID of the client's service account user, or the problem when it has none.
   */
  async function findServiceAccount(target: InspectionTarget, found: FoundClient) {
    if (found.configuration.client.serviceAccountsEnabled !== true) {
      return { ok: false as const, problem: createProblem('not-found', 'NO_SERVICE_ACCOUNT') };
    }
    const serviceAccount = await clientReader.getServiceAccountUser(target.reader, found.internalId);
    if (serviceAccount.ok === false) {
      return serviceAccount;
    }
    const id = optionalString(serviceAccount.value.id);
    const username = optionalString(serviceAccount.value.username);
    return id && username
      ? { ok: true as const, value: { id, username, enabled: optionalBoolean(serviceAccount.value.enabled) } }
      : { ok: false as const, problem: createProblem('not-found', 'NO_SERVICE_ACCOUNT') };
  }

  const checkAccessClientSetup = createTool({
    id: 'checkAccessClientSetup',
    description:
      'Check a client\'s setup against ADSP guidance, for questions like "is my app set up right?". Returns findings ' +
      'with fixes, and the values the app needs (keycloak-js settings or a token request).',
    inputSchema: z.object({ clientId: clientIdSchema }),
    outputSchema: setupOutputSchema,
    toModelOutput: createModelOutput<SetupOutput>((output) => [
      ...(output.client ? [`client: ${describeClientSummary(output.client)}`] : describeClientLookup(output)),
      output.client?.builtIn && output.message,
      ...describeFindings(output.findings),
      ...describeSetupValues(output.setup),
      output.secretCreatedAt && `secret created: ${shortTime(output.secretCreatedAt)}`,
    ]),
    execute: async ({ clientId }, context: ToolExecutionContext) =>
      run('checkAccessClientSetup', context, async (user): Promise<SetupOutput> => {
        const result = await findClient(user, clientId);
        if (result.ok === false) {
          return result.output;
        }

        const { target, found } = result;
        const { environment, realm } = target;
        const client = toClientDetails(found.configuration);
        let serviceAccountClientRoleCount: number | undefined;
        if (client.flows.serviceAccounts) {
          const serviceAccount = await findServiceAccount(target, found);
          const mappings =
            serviceAccount.ok === true
              ? await userReader.getUserRoleMappings(target.reader, serviceAccount.value.id)
              : undefined;
          serviceAccountClientRoleCount = mappings?.ok === true ? countClientRoles(mappings.value) : undefined;
        }

        const secretCreatedAt =
          client.type === 'confidential' ? readSecretCreatedAt(found.configuration.client) : undefined;
        const findings = checkClientSetup({
          client,
          environmentId: environment.id,
          serviceAccountClientRoleCount,
          secretCreatedAt,
        });
        const problems = findings.filter((finding) => finding.severity === 'problem').length;
        const warnings = findings.filter((finding) => finding.severity === 'warning').length;

        return {
          status: 'available',
          message: client.builtIn
            ? `${clientId} is built into Keycloak, so its setup is not checked.`
            : `Checked ${clientId} in ${describeRealm(target)} (read-only): ${problems} problems, ${warnings} ` +
              `warnings, ${findings.length - problems - warnings} tips.`,
          environment,
          realm,
          clientId,
          client: toClientSummary(found.configuration.client),
          findings,
          setup: toClientSetupValues(environment.host, realm.realm, client),
          ...(secretCreatedAt ? { secretCreatedAt: secretCreatedAt.toISOString() } : {}),
        };
      }),
  });

  const checkAccessClientUrl = createTool({
    id: 'checkAccessClientUrl',
    description:
      "Check whether a web address of the user's app is allowed as a client's redirect URI, web origin and " +
      'post-logout redirect URI, for "Invalid parameter: redirect_uri", CORS or sign-out errors.',
    inputSchema: urlInputSchema,
    outputSchema: urlOutputSchema,
    toModelOutput: createModelOutput<UrlOutput>((output) => [
      ...describeClientLookup(output),
      ...describeUrlCheck(output.check),
    ]),
    execute: async ({ clientId, url }, context: ToolExecutionContext) =>
      run('checkAccessClientUrl', context, async (user): Promise<UrlOutput> => {
        const appUrl = parseAppUrl(url);
        const result = await findClient(user, clientId);
        if (result.ok === false) {
          return result.output;
        }

        const { target, found } = result;
        const { environment, realm } = target;
        if (!appUrl) {
          return { ...toProblemFields(createProblem('unavailable', 'INVALID_URL')), environment, realm, clientId };
        }

        const check = checkClientUrl(toClientDetails(found.configuration), appUrl);
        const allowed = [check.redirect.allowed, check.webOrigin.allowed, check.postLogout.allowed];
        return {
          status: 'available',
          message:
            `Checked ${check.url} against ${clientId} in ${describeRealm(target)} (read-only): ` +
            `${allowed.filter(Boolean).length} of 3 checks allow it.`,
          environment,
          realm,
          clientId,
          check,
        };
      }),
  });

  const previewAccessToken = createTool({
    id: 'previewAccessToken',
    description:
      'Preview what an access token from a client would contain, without issuing one: audience, scopes, roles, ' +
      "lifetime, claim names and mappers. Give `user` for a person's token (not in Production).",
    inputSchema: tokenInputSchema,
    outputSchema: tokenOutputSchema,
    toModelOutput: createModelOutput<TokenOutput>((output) => [
      ...describeClientLookup(output),
      output.search && `person searched for: "${output.search}"`,
      output.search && output.status === 'available' && output.message,
      ...describeTokenPreview(output.preview),
    ]),
    execute: async ({ clientId, user: search, scope }, context: ToolExecutionContext) =>
      run('previewAccessToken', context, async (user): Promise<TokenOutput> => {
        const result = await findClient(user, clientId, !!search);
        if (result.ok === false) {
          return { ...result.output, ...(search ? { search } : {}) };
        }

        const { target, found } = result;
        const { environment, realm, reader } = target;
        let subjectId: string;
        let matchNote = '';
        if (search) {
          const person = await userLookup.lookupUser(target, search);
          if (person.ok === false) {
            return { ...toLookupFailureFields(target, search, person.failure), clientId };
          }
          subjectId = person.value.userId;
          matchNote = describeMatch(search, person.value);
        } else {
          const serviceAccount = await findServiceAccount(target, found);
          if (serviceAccount.ok === false) {
            return { ...toProblemFields(serviceAccount.problem), environment, realm, clientId };
          }
          subjectId = serviceAccount.value.id;
        }

        const requestedScope = [DEFAULT_TOKEN_SCOPE, ...(scope ? scope.split(' ') : [])]
          .filter((value, index, all) => all.indexOf(value) === index)
          .join(' ');
        const [claims, mappers] = await Promise.all([
          clientReader.generateExampleAccessToken(reader, found.internalId, subjectId, requestedScope),
          clientReader.listEffectiveProtocolMappers(reader, found.internalId, requestedScope),
        ]);
        if (claims.ok === false) {
          return { ...toProblemFields(claims.problem), environment, realm, clientId };
        }

        const preview = toTokenPreview({
          app: clientId,
          subject: search ? 'user' : 'service-account',
          scope: requestedScope,
          claims: claims.value,
          mappers: mappers.ok === true ? mappers.value : [],
        });
        return {
          status: 'available',
          message: [
            `Preview of the access token ${clientId} would get in ${describeRealm(target)} (read-only; no token was ` +
              'issued).',
            matchNote,
          ]
            .filter(Boolean)
            .join(' '),
          environment,
          realm,
          clientId,
          ...(search ? { search } : {}),
          preview,
        };
      }),
  });

  const getAccessServiceAccount = createTool({
    id: 'getAccessServiceAccount',
    description:
      "Show a client's service account: whether it is on, its roles, secret age and how to get a token. With " +
      "`service`, also checks that service's roles and audience, for errors like 403 from form-service. Works in " +
      'every environment.',
    inputSchema: serviceAccountInputSchema,
    outputSchema: serviceAccountOutputSchema,
    toModelOutput: createModelOutput<ServiceAccountOutput>((output) => [
      ...describeClientLookup(output),
      describeServiceAccount(output.serviceAccount),
      ...describeUserRoles(output.roles),
      ...describeServiceChecks(output.services),
      ...describeSetupValues(output.setup),
      describeNotes(output.notes),
    ]),
    execute: async ({ clientId, service }, context: ToolExecutionContext) =>
      run('getAccessServiceAccount', context, async (user): Promise<ServiceAccountOutput> => {
        const result = await findClient(user, clientId);
        if (result.ok === false) {
          return result.output;
        }

        const { target, found } = result;
        const { environment, realm, reader } = target;
        const serviceAccount = await findServiceAccount(target, found);
        if (serviceAccount.ok === false) {
          return { ...toProblemFields(serviceAccount.problem), environment, realm, clientId };
        }

        const assignments = await roleAssignments.resolveUserRoleAssignments(reader, serviceAccount.value.id);
        if (assignments.ok === false) {
          return { ...toProblemFields(assignments.problem), environment, realm, clientId };
        }

        const notes: string[] = [];
        let services: ServiceAccountOutput['services'];
        if (service) {
          const [resolved, claims] = await Promise.all([
            resolveServiceDefinitions(access, target, user, service),
            clientReader.generateExampleAccessToken(
              reader,
              found.internalId,
              serviceAccount.value.id,
              DEFAULT_TOKEN_SCOPE,
            ),
          ]);
          notes.push(...resolved.notes);
          if (resolved.definitions.length === 0) {
            notes.push(`No service matching "${service}" was found.`);
          }
          if (claims.ok === false) {
            notes.push('The service account token could not be previewed, so the audience was not checked.');
          }
          const token = claims.ok === true ? { app: clientId, claims: claims.value } : undefined;
          services = resolved.definitions.map((definitions) =>
            checkServiceRoles(definitions, assignments.value, token),
          );
        }

        const secretCreatedAt = readSecretCreatedAt(found.configuration.client);
        const roles = toAccessUserRoles(assignments.value);
        return {
          status: 'available',
          message:
            `Service account of ${clientId} in ${describeRealm(target)} (read-only): ${roles.counts.direct} roles ` +
            `assigned directly and ${roles.counts.inherited} inherited.`,
          environment,
          realm,
          clientId,
          serviceAccount: {
            username: serviceAccount.value.username,
            ...(serviceAccount.value.enabled !== undefined ? { enabled: serviceAccount.value.enabled } : {}),
            ...(secretCreatedAt ? { secretCreatedAt: secretCreatedAt.toISOString() } : {}),
          },
          roles,
          ...(services ? { services } : {}),
          setup: toClientSetupValues(environment.host, realm.realm, toClientDetails(found.configuration)),
          ...(notes.length > 0 ? { notes } : {}),
        };
      }),
  });

  return { checkAccessClientSetup, checkAccessClientUrl, previewAccessToken, getAccessServiceAccount };
}
