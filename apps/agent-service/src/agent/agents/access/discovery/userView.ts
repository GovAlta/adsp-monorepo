import z from 'zod';
import type { KeycloakRepresentation } from './adminRead';
import type { ResolvedRole, ResolvedRoleAssignments } from './roleAssignments';
import { optionalBoolean, optionalString, recordList, stringList } from './values';

/**
 * Troubleshooting view of a Keycloak user and their role assignments. Every field is read from an explicit allowlist,
 * so email, first and last name, attributes, credentials and the user's IDs at identity providers are never copied.
 */

export const accessUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  enabled: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  requiredActions: z.array(z.string()),
  identityProviders: z.array(z.string()),
});

const roleRefSchema = z.object({ name: z.string(), client: z.string().optional() });

const roleSourceSchema = z.object({
  type: z.enum(['direct', 'group', 'composite', 'unresolved']),
  group: z.string().optional(),
  via: z.array(roleRefSchema).optional(),
});

const assignedRoleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  composite: z.boolean(),
  inherited: z.boolean(),
  sources: z.array(roleSourceSchema),
});

export const accessUserRolesSchema = z.object({
  realmRoles: z.array(assignedRoleSchema),
  clientRoles: z.array(z.object({ clientId: z.string(), roles: z.array(assignedRoleSchema) })),
  groups: z.array(z.string()),
  counts: z.object({ direct: z.number(), inherited: z.number() }),
  incomplete: z.boolean().optional(),
});

export type AccessUser = z.infer<typeof accessUserSchema>;
export type AccessUserRoles = z.infer<typeof accessUserRolesSchema>;
type AssignedRole = z.infer<typeof assignedRoleSchema>;

/**
 * Builds the identifying view of a user. Returns undefined for a representation without an ID or username.
 */
export function toAccessUser(user: KeycloakRepresentation): AccessUser | undefined {
  const id = optionalString(user.id);
  const username = optionalString(user.username);
  if (!id || !username) {
    return undefined;
  }

  return {
    id,
    username,
    enabled: optionalBoolean(user.enabled),
    emailVerified: optionalBoolean(user.emailVerified),
    requiredActions: [...stringList(user.requiredActions)].sort(),
    // Only the identity provider alias is kept; the user's ID and username at the provider are dropped.
    identityProviders: recordList(user.federatedIdentities)
      .map((identity) => optionalString(identity.identityProvider))
      .filter((alias): alias is string => !!alias)
      .sort(),
  };
}

function toAssignedRole({ name, description, composite, sources }: ResolvedRole): AssignedRole {
  return {
    name,
    ...(description ? { description } : {}),
    composite,
    inherited: !sources.some((source) => source.type === 'direct'),
    sources,
  };
}

const byName = (left: { name: string }, right: { name: string }) => left.name.localeCompare(right.name);

/**
 * Groups resolved role assignments into realm roles and client roles by client, in name order.
 */
export function toAccessUserRoles({ roles, groups, incomplete }: ResolvedRoleAssignments): AccessUserRoles {
  const realmRoles = roles
    .filter((role) => !role.client)
    .map(toAssignedRole)
    .sort(byName);

  const rolesByClient = new Map<string, AssignedRole[]>();
  for (const role of roles.filter((resolved) => !!resolved.client)) {
    rolesByClient.set(role.client, [...(rolesByClient.get(role.client) ?? []), toAssignedRole(role)]);
  }
  const clientRoles = [...rolesByClient.entries()]
    .map(([clientId, clientRoleList]) => ({ clientId, roles: clientRoleList.sort(byName) }))
    .sort((left, right) => left.clientId.localeCompare(right.clientId));

  const all = [...realmRoles, ...clientRoles.flatMap((client) => client.roles)];
  const inherited = all.filter((role) => role.inherited).length;

  return {
    realmRoles,
    clientRoles,
    groups,
    counts: { direct: all.length - inherited, inherited },
    ...(incomplete ? { incomplete } : {}),
  };
}
