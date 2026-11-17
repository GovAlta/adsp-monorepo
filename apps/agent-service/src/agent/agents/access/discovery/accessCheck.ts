import z from 'zod';
import type { KeycloakRepresentation } from './adminRead';
import type { ResolvedRole, ResolvedRoleAssignments, RoleSource } from './roleAssignments';
import { asRecord, stringList } from './values';

/**
 * Answers "can this person use this service, and if not, what is missing" and "what is different between these two
 * people", from role assignments already resolved with their sources.
 */

export const MAX_COMPARED_ROLES = 100;

const roleSourceSchema = z.object({
  type: z.enum(['direct', 'group', 'composite', 'unresolved']),
  group: z.string().optional(),
  via: z.array(z.object({ name: z.string(), client: z.string().optional() })).optional(),
});

export const accessServiceCheckSchema = z.object({
  service: z.string(),
  rolesFrom: z.enum(['platform', 'tenant', 'client']),
  roles: z.array(
    z.object({
      role: z.string(),
      description: z.string().optional(),
      inTenantAdmin: z.boolean().optional(),
      has: z.boolean(),
      sources: z.array(roleSourceSchema),
      inToken: z.boolean().optional(),
    }),
  ),
  otherRoles: z.array(z.object({ role: z.string(), sources: z.array(roleSourceSchema) })),
  token: z.object({ app: z.string(), audienceIncluded: z.boolean() }).optional(),
});

const comparedRoleSchema = z.object({
  name: z.string(),
  client: z.string().optional(),
  sources: z.array(roleSourceSchema),
});

export const accessUserComparisonSchema = z.object({
  onlyFirst: z.array(comparedRoleSchema),
  onlySecond: z.array(comparedRoleSchema),
  sharedCount: z.number(),
  groups: z.object({ onlyFirst: z.array(z.string()), onlySecond: z.array(z.string()) }),
  truncated: z.boolean().optional(),
});

export type AccessServiceCheck = z.infer<typeof accessServiceCheckSchema>;
export type AccessUserComparison = z.infer<typeof accessUserComparisonSchema>;

export interface ServiceRoleDefinitions {
  service: string;
  rolesFrom: AccessServiceCheck['rolesFrom'];
  roles: Array<{ role: string; description?: string; inTenantAdmin?: boolean }>;
}

export interface ExampleToken {
  app: string;
  claims: KeycloakRepresentation;
}

function audienceOf(claims: KeycloakRepresentation): string[] {
  return typeof claims.aud === 'string' ? [claims.aud] : stringList(claims.aud);
}

function tokenRolesFor(claims: KeycloakRepresentation, service: string): Set<string> {
  return new Set(stringList(asRecord(asRecord(claims.resource_access)[service]).roles));
}

/**
 * Checks each role a service defines against the roles the user holds, with how each held role is held. When an
 * example token from an app is given, also checks whether each role and the service's audience would be in that
 * app's token.
 */
export function checkServiceRoles(
  definitions: ServiceRoleDefinitions,
  assignments: ResolvedRoleAssignments,
  token?: ExampleToken,
): AccessServiceCheck {
  const held = new Map(
    assignments.roles.filter((role) => role.client === definitions.service).map((role) => [role.name, role]),
  );
  const tokenRoles = token ? tokenRolesFor(token.claims, definitions.service) : undefined;
  const defined = new Set(definitions.roles.map((role) => role.role));

  return {
    service: definitions.service,
    rolesFrom: definitions.rolesFrom,
    roles: definitions.roles.map(({ role, description, inTenantAdmin }) => ({
      role,
      ...(description ? { description } : {}),
      ...(inTenantAdmin !== undefined ? { inTenantAdmin } : {}),
      has: held.has(role),
      sources: held.get(role)?.sources ?? [],
      ...(tokenRoles ? { inToken: tokenRoles.has(role) } : {}),
    })),
    otherRoles: [...held.values()]
      .filter((role) => !defined.has(role.name))
      .map((role) => ({ role: role.name, sources: role.sources }))
      .sort((left, right) => left.role.localeCompare(right.role)),
    ...(token
      ? { token: { app: token.app, audienceIncluded: audienceOf(token.claims).includes(definitions.service) } }
      : {}),
  };
}

const roleKey = ({ name, client }: ResolvedRole) => `${client ?? ''}\n${name}`;

function toComparedRole({ name, client, sources }: ResolvedRole): {
  name: string;
  client?: string;
  sources: RoleSource[];
} {
  return { name, ...(client ? { client } : {}), sources };
}

const byClientThenName = (left: ResolvedRole, right: ResolvedRole) =>
  (left.client ?? '').localeCompare(right.client ?? '') || left.name.localeCompare(right.name);

/**
 * Lists the roles and groups only one of two users has. Roles both have are only counted.
 */
export function compareRoleAssignments(
  first: ResolvedRoleAssignments,
  second: ResolvedRoleAssignments,
): AccessUserComparison {
  const firstKeys = new Set(first.roles.map(roleKey));
  const secondKeys = new Set(second.roles.map(roleKey));
  const onlyFirst = first.roles.filter((role) => !secondKeys.has(roleKey(role))).sort(byClientThenName);
  const onlySecond = second.roles.filter((role) => !firstKeys.has(roleKey(role))).sort(byClientThenName);
  const firstGroups = new Set(first.groups);
  const secondGroups = new Set(second.groups);
  const truncated =
    onlyFirst.length > MAX_COMPARED_ROLES ||
    onlySecond.length > MAX_COMPARED_ROLES ||
    first.incomplete ||
    second.incomplete;

  return {
    onlyFirst: onlyFirst.slice(0, MAX_COMPARED_ROLES).map(toComparedRole),
    onlySecond: onlySecond.slice(0, MAX_COMPARED_ROLES).map(toComparedRole),
    sharedCount: first.roles.filter((role) => secondKeys.has(roleKey(role))).length,
    groups: {
      onlyFirst: first.groups.filter((group) => !secondGroups.has(group)),
      onlySecond: second.groups.filter((group) => !firstGroups.has(group)),
    },
    ...(truncated ? { truncated } : {}),
  };
}
