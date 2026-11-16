import type { ServiceDirectory } from '@abgov/adsp-service-sdk';
import { createTool } from '@mastra/core/tools';
import type { ToolExecutionContext } from '@mastra/core/tools';
import type { Logger } from 'winston';
import z from 'zod';
import {
  accessRoleMemberSchema,
  accessServiceRolesEntrySchema,
  createProblem,
  findIncludingRoles,
  findRolesByName,
  IndexedRole,
  isUserInspectionAllowed,
  matchServiceIds,
  RoleIndex,
  toProblemFields,
  toRoleRef,
} from '../agents/access/discovery';
import { displayText } from '../agents/access/discovery/values';
import { createModelOutput, describeList, ModelLine } from './accessModelOutput';
import { AccessReaders, createAccessReaders } from './accessReaders';
import {
  describeRoleDetails,
  describeRoleMembers,
  describeRoleRef,
  describeServiceRoleCatalog,
} from './accessRoleModelOutput';
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

const MAX_TEXT_LENGTH = 255;
const MAX_ROLE_SUGGESTIONS = 5;
const MAX_LISTED_ROLE_LINKS = 100;
const MAX_LISTED_INCLUDING_ROLES = 25;

const roleRefSchema = z.object({ name: z.string(), client: z.string().optional() });

const serviceTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_TEXT_LENGTH)
  .describe('The service or app as the user named it, e.g. "forms" or a client ID.');

const roleInputSchema = z.object({
  role: z
    .string()
    .trim()
    .min(1)
    .max(MAX_TEXT_LENGTH)
    .describe('The role name, e.g. tenant-admin, or "<client ID>:<role>".'),
  service: serviceTextSchema.optional().describe('The service or app the role belongs to, as the user named it.'),
});

const listServiceRolesInputSchema = z.object({
  service: serviceTextSchema.optional().describe('The service to list roles for; omit for all services.'),
});

const roleLookupFields = {
  ...accessResultFields,
  environment: accessEnvironmentSchema.optional(),
  realm: accessRealmSchema.optional(),
  search: z.string(),
  suggestions: z.array(z.string()).optional(),
};

const serviceRolesOutputSchema = z.object({
  ...accessResultFields,
  environment: accessEnvironmentSchema.optional(),
  realm: accessRealmSchema.optional(),
  search: z.string().optional(),
  services: z.array(accessServiceRolesEntrySchema),
});

const roleOutputSchema = z.object({
  ...roleLookupFields,
  role: z
    .object({
      name: z.string(),
      client: z.string().optional(),
      description: z.string().optional(),
      composite: z.boolean(),
      inTenantAdmin: z.boolean().optional(),
      includes: z.array(roleRefSchema),
      includedIn: z.array(roleRefSchema.extend({ via: z.array(roleRefSchema) })),
      truncated: z.boolean().optional(),
    })
    .optional(),
});

const roleMembersOutputSchema = z.object({
  ...roleLookupFields,
  role: roleRefSchema.optional(),
  members: z.array(accessRoleMemberSchema).optional(),
  counts: z.object({ direct: z.number(), group: z.number(), composite: z.number() }).optional(),
  truncated: z.boolean().optional(),
});

type ServiceRolesOutput = z.infer<typeof serviceRolesOutputSchema>;
type RoleOutput = z.infer<typeof roleOutputSchema>;
type RoleMembersOutput = z.infer<typeof roleMembersOutputSchema>;

interface AccessRoleToolsProps {
  logger: Logger;
  directory: ServiceDirectory;
  accessServiceUrl: URL;
  readers?: AccessReaders;
}

type FoundRole =
  | { ok: true; index: RoleIndex; role: IndexedRole }
  | { ok: false; output: z.infer<z.ZodObject<typeof roleLookupFields>> };

function describeRole({ name, client }: { name: string; client?: string }): string {
  return client ? `${name} on ${client}` : name;
}

function describeRoleLookup({
  status,
  search,
  suggestions,
}: z.infer<z.ZodObject<typeof roleLookupFields>>): ModelLine[] {
  return [
    status !== 'available' && `role searched for: "${search}"`,
    suggestions && describeList('suggestions', suggestions),
  ];
}

export function createAccessRoleTools({ logger, directory, accessServiceUrl, readers }: AccessRoleToolsProps) {
  const resolveInspectionTarget = createInspectionTargetResolver({ directory, accessServiceUrl });
  const resolvePeopleTarget = createInspectionTargetResolver({
    directory,
    accessServiceUrl,
    environmentRule: { isAllowed: isUserInspectionAllowed, reason: 'USER_INSPECTION_NOT_ALLOWED' },
  });
  const access = readers ?? createAccessReaders({ directory });
  const { catalogReader, roleReader, roleIndex, roleMembers } = access;
  const run = createAccessToolRunner({ logger, logContext: 'AccessRoleTools', toolKind: 'Access role tool' });

  /**
   * Finds one role by name, narrowed to a service when one is named. Several matches are returned as suggestions.
   */
  async function findRole(target: InspectionTarget, search: string, service?: string): Promise<FoundRole> {
    const { environment, realm, reader } = target;
    const index = await roleIndex.buildRoleIndex(reader);
    if (index.ok === false) {
      return { ok: false, output: { ...toProblemFields(index.problem), environment, realm, search } };
    }

    const clientIds = [...new Set([...index.value.roles.values()].map((role) => role.client).filter((id) => !!id))];
    const services = service ? matchServiceIds(clientIds, service) : [undefined];
    const matches = services.flatMap((clientId) => findRolesByName(index.value, search, clientId));
    if (matches.length === 1) {
      return { ok: true, index: index.value, role: matches[0] };
    }

    if (matches.length > 1) {
      return {
        ok: false,
        output: {
          ...toProblemFields(createProblem('not-found', 'ROLE_AMBIGUOUS')),
          environment,
          realm,
          search,
          suggestions: matches.slice(0, MAX_ROLE_SUGGESTIONS).map((role) => describeRole(role)),
        },
      };
    }

    const text = search.toLowerCase();
    const similar = [...index.value.roles.values()]
      .filter((role) => role.name.toLowerCase().includes(text))
      .slice(0, MAX_ROLE_SUGGESTIONS)
      .map((role) => describeRole(role));
    return {
      ok: false,
      output: {
        ...toProblemFields(createProblem('not-found', 'ROLE_NOT_FOUND')),
        environment,
        realm,
        search,
        ...(similar.length > 0 ? { suggestions: similar } : {}),
      },
    };
  }

  const listAccessServiceRoles = createTool({
    id: 'listAccessServiceRoles',
    description:
      'List the roles ADSP platform and tenant services define, what each is for and whether the service adds it ' +
      'to tenant-admin by default. Use it to explain a role or which role someone needs for a service.',
    inputSchema: listServiceRolesInputSchema,
    outputSchema: serviceRolesOutputSchema,
    toModelOutput: createModelOutput<ServiceRolesOutput>(({ search, services }) => [
      search && `service searched for: "${search}"`,
      ...describeServiceRoleCatalog(services),
    ]),
    execute: async ({ service }, context: ToolExecutionContext) =>
      run('listAccessServiceRoles', context, async (user): Promise<ServiceRolesOutput> => {
        const target = await resolveInspectionTarget(user);
        if (target.ok === false) {
          return { ...toTargetProblemFields(target), services: [] };
        }

        const { environment, realm } = target.value;
        const catalog = await catalogReader.getCatalog(user);
        if (catalog.ok === false) {
          return { ...toProblemFields(catalog.problem), environment, realm, services: [] };
        }

        const matched = service
          ? new Set(
              matchServiceIds(
                catalog.value.map((entry) => entry.service),
                service,
              ),
            )
          : undefined;
        const services = matched ? catalog.value.filter((entry) => matched.has(entry.service)) : catalog.value;
        if (service && services.length === 0) {
          return {
            ...toProblemFields(createProblem('not-found', 'SERVICE_NOT_FOUND')),
            environment,
            realm,
            search: service,
            services: [],
          };
        }

        const roleCount = services.reduce((count, entry) => count + entry.roles.length, 0);
        return {
          status: 'available',
          message: `${roleCount} roles across ${services.length} services (read-only).`,
          environment,
          realm,
          ...(service ? { search: service } : {}),
          services,
        };
      }),
  });

  const getAccessRole = createTool({
    id: 'getAccessRole',
    description:
      'Explain one role: its description, the roles it includes, and the composite roles that include it, to say ' +
      'what gives someone the role.',
    inputSchema: roleInputSchema,
    outputSchema: roleOutputSchema,
    toModelOutput: createModelOutput<RoleOutput>((output) => [
      ...describeRoleLookup(output),
      ...describeRoleDetails(output.role),
    ]),
    execute: async ({ role: search, service }, context: ToolExecutionContext) =>
      run('getAccessRole', context, async (user): Promise<RoleOutput> => {
        const target = await resolveInspectionTarget(user);
        if (target.ok === false) {
          return { ...toTargetProblemFields(target), search };
        }

        const found = await findRole(target.value, search, service);
        if (found.ok === false) {
          return found.output;
        }

        const { environment, realm, reader } = target.value;
        const { index, role } = found;
        const [details, catalog] = await Promise.all([
          roleReader.getRole(reader, { name: role.name, clientUuid: role.clientUuid }),
          catalogReader.getCatalog(user),
        ]);
        const catalogRole =
          catalog.ok === true
            ? catalog.value
                .filter((entry) => entry.service === role.client)
                .flatMap((entry) => entry.roles)
                .find((entry) => entry.role === role.name)
            : undefined;

        const includes = (index.children.get(role.id) ?? [])
          .map((id) => index.roles.get(id))
          .filter((child) => !!child)
          .map(toRoleRef)
          .sort((left, right) => describeRole(left).localeCompare(describeRole(right)));
        const includedIn = findIncludingRoles(index, role.id).map(({ role: parent, via }) => ({
          ...toRoleRef(parent),
          via,
        }));
        const truncated =
          index.incomplete || includes.length > MAX_LISTED_ROLE_LINKS || includedIn.length > MAX_LISTED_INCLUDING_ROLES;
        const description =
          (details.ok === true ? displayText(details.value.description) : undefined) ?? catalogRole?.description;

        return {
          status: 'available',
          message: `Role ${describeRole(role)} in ${describeRealm(target.value)} (read-only).`,
          environment,
          realm,
          search,
          role: {
            ...toRoleRef(role),
            ...(description ? { description } : {}),
            composite: role.composite,
            ...(catalogRole ? { inTenantAdmin: catalogRole.inTenantAdmin } : {}),
            includes: includes.slice(0, MAX_LISTED_ROLE_LINKS),
            includedIn: includedIn.slice(0, MAX_LISTED_INCLUDING_ROLES),
            ...(truncated ? { truncated } : {}),
          },
        };
      }),
  });

  const listAccessRoleMembers = createTool({
    id: 'listAccessRoleMembers',
    description:
      'List the people and service accounts holding a role directly, through a group or through a composite role, ' +
      'for questions like "who are my tenant admins?". Not in Production.',
    inputSchema: roleInputSchema,
    outputSchema: roleMembersOutputSchema,
    toModelOutput: createModelOutput<RoleMembersOutput>((output) => [
      ...describeRoleLookup(output),
      output.role && `role: ${describeRoleRef(output.role)}`,
      ...describeRoleMembers(output),
    ]),
    execute: async ({ role: search, service }, context: ToolExecutionContext) =>
      run('listAccessRoleMembers', context, async (user): Promise<RoleMembersOutput> => {
        const target = await resolvePeopleTarget(user);
        if (target.ok === false) {
          return { ...toTargetProblemFields(target), search };
        }

        const found = await findRole(target.value, search, service);
        if (found.ok === false) {
          return found.output;
        }

        const { environment, realm, reader } = target.value;
        const members = await roleMembers.resolveRoleMembers(reader, found.index, found.role);
        if (members.ok === false) {
          return { ...toProblemFields(members.problem), environment, realm, search, role: toRoleRef(found.role) };
        }

        const counts = { direct: 0, group: 0, composite: 0 };
        for (const member of members.value.members) {
          const type = member.sources[0]?.type;
          if (type === 'direct' || type === 'group' || type === 'composite') {
            counts[type]++;
          }
        }
        const total = members.value.members.length;
        return {
          status: 'available',
          message:
            `${members.value.truncated ? 'At least ' : ''}${total} ${total === 1 ? 'account holds' : 'accounts hold'} ` +
            `${describeRole(found.role)} in ${describeRealm(target.value)} (read-only).`,
          environment,
          realm,
          search,
          role: toRoleRef(found.role),
          members: members.value.members,
          counts,
          ...(members.value.truncated ? { truncated: true } : {}),
        };
      }),
  });

  return { listAccessServiceRoles, getAccessRole, listAccessRoleMembers };
}
