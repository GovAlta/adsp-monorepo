import z from 'zod';
import type { AdminReadTarget, KeycloakRepresentation } from './adminRead';
import type { RealmClientResult } from './realmClient';
import type { RoleRef, RoleSource } from './roleAssignments';
import { findIncludingRoles, IndexedRole, RoleIndex } from './roleIndex';
import type { RoleLocator, RoleReader } from './roleReader';
import { optionalString } from './values';

/**
 * Resolves who holds a role and how: assigned directly, through a group (members of its subgroups included), or
 * through a composite role that includes it. Every list is capped; hitting a cap marks the result truncated rather
 * than reading on. Only usernames are returned, never emails or names.
 */

export const MAX_ROLE_MEMBERS = 100;
export const MAX_ROLE_HOLDER_ROLES = 25;
export const MAX_ROLE_GROUPS = 25;
export const MAX_MEMBER_SOURCES = 3;

const SERVICE_ACCOUNT_PREFIX = 'service-account-';

const roleRefSchema = z.object({ name: z.string(), client: z.string().optional() });

export const accessRoleMemberSchema = z.object({
  username: z.string(),
  serviceAccount: z.boolean(),
  enabled: z.boolean().optional(),
  sources: z.array(
    z.object({
      type: z.enum(['direct', 'group', 'composite', 'unresolved']),
      group: z.string().optional(),
      via: z.array(roleRefSchema).optional(),
    }),
  ),
});

export type AccessRoleMember = z.infer<typeof accessRoleMemberSchema>;

export interface RoleMembers {
  members: AccessRoleMember[];
  truncated: boolean;
}

interface Holder {
  role: IndexedRole;
  /** Composite roles from the holder role down to the requested role; empty for the role itself. */
  via: RoleRef[];
}

interface MemberRecord {
  username: string;
  enabled?: boolean;
  sources: Map<string, RoleSource>;
}

function toLocator({ name, clientUuid }: IndexedRole): RoleLocator {
  return clientUuid ? { name, clientUuid } : { name };
}

function sourceFor(via: RoleRef[], group?: string): RoleSource {
  if (via.length === 0) {
    return group ? { type: 'group', group } : { type: 'direct' };
  }
  return group ? { type: 'composite', via, group } : { type: 'composite', via };
}

const SOURCE_ORDER: Record<RoleSource['type'], number> = { direct: 0, group: 1, composite: 2, unresolved: 3 };

export function createRoleMemberResolver(roleReader: RoleReader) {
  /**
   * Lists a group's members and the members of its subgroups, who inherit the group's roles.
   */
  async function listGroupTreeMembers(
    target: AdminReadTarget,
    groupId: string,
    budget: { groups: number },
  ): Promise<{ users: KeycloakRepresentation[]; truncated: boolean }> {
    const users: KeycloakRepresentation[] = [];
    let truncated = false;
    const queue = [groupId];

    while (queue.length > 0) {
      if (budget.groups <= 0) {
        return { users, truncated: true };
      }
      budget.groups--;
      const id = queue.shift();
      const [members, subgroups] = await Promise.all([
        roleReader.listGroupMembers(target, id, MAX_ROLE_MEMBERS + 1),
        roleReader.listSubgroups(target, id, MAX_ROLE_GROUPS + 1),
      ]);
      if (members.ok === true) {
        truncated = truncated || members.value.length > MAX_ROLE_MEMBERS;
        users.push(...members.value.slice(0, MAX_ROLE_MEMBERS));
      } else {
        truncated = true;
      }
      if (subgroups.ok === true) {
        truncated = truncated || subgroups.value.length > MAX_ROLE_GROUPS;
        subgroups.value
          .slice(0, MAX_ROLE_GROUPS)
          .map((group) => optionalString(group.id))
          .filter((subgroupId) => !!subgroupId)
          .forEach((subgroupId) => queue.push(subgroupId));
      }
    }

    return { users, truncated };
  }

  async function resolveRoleMembers(
    target: AdminReadTarget,
    index: RoleIndex,
    role: IndexedRole,
  ): Promise<RealmClientResult<RoleMembers>> {
    const including = findIncludingRoles(index, role.id);
    const holders: Holder[] = [{ role, via: [] }, ...including];
    let truncated = index.incomplete || holders.length > MAX_ROLE_HOLDER_ROLES;

    const members = new Map<string, MemberRecord>();
    const addMember = (user: KeycloakRepresentation, source: RoleSource) => {
      const id = optionalString(user.id);
      const username = optionalString(user.username);
      if (!id || !username) {
        return;
      }
      if (!members.has(id) && members.size >= MAX_ROLE_MEMBERS) {
        truncated = true;
        return;
      }
      const record = members.get(id) ?? {
        username,
        enabled: user.enabled === false ? false : undefined,
        sources: new Map<string, RoleSource>(),
      };
      record.sources.set(JSON.stringify(source), source);
      members.set(id, record);
    };

    const budget = { groups: MAX_ROLE_GROUPS };
    for (const holder of holders.slice(0, MAX_ROLE_HOLDER_ROLES)) {
      const locator = toLocator(holder.role);
      const [users, groups] = await Promise.all([
        roleReader.listRoleUsers(target, locator, MAX_ROLE_MEMBERS + 1),
        roleReader.listRoleGroups(target, locator, MAX_ROLE_GROUPS + 1),
      ]);
      // The requested role itself must be readable; roles that include it are best-effort.
      if (users.ok === false && holder.via.length === 0) {
        return users;
      }
      if (users.ok === true) {
        truncated = truncated || users.value.length > MAX_ROLE_MEMBERS;
        users.value.slice(0, MAX_ROLE_MEMBERS).forEach((user) => addMember(user, sourceFor(holder.via)));
      } else {
        truncated = true;
      }

      if (groups.ok === false) {
        truncated = true;
        continue;
      }
      truncated = truncated || groups.value.length > MAX_ROLE_GROUPS;
      for (const group of groups.value.slice(0, MAX_ROLE_GROUPS)) {
        const groupId = optionalString(group.id);
        const path = optionalString(group.path) ?? optionalString(group.name);
        if (!groupId || !path) {
          continue;
        }
        const tree = await listGroupTreeMembers(target, groupId, budget);
        truncated = truncated || tree.truncated;
        tree.users.forEach((user) => addMember(user, sourceFor(holder.via, path)));
      }
    }

    const result = [...members.values()]
      .map(
        ({ username, enabled, sources }): AccessRoleMember => ({
          username,
          serviceAccount: username.startsWith(SERVICE_ACCOUNT_PREFIX),
          ...(enabled === false ? { enabled } : {}),
          sources: [...sources.values()]
            .sort((left, right) => SOURCE_ORDER[left.type] - SOURCE_ORDER[right.type])
            .slice(0, MAX_MEMBER_SOURCES),
        }),
      )
      .sort(
        (left, right) =>
          SOURCE_ORDER[left.sources[0].type] - SOURCE_ORDER[right.sources[0].type] ||
          left.username.localeCompare(right.username),
      );

    return { ok: true, value: { members: result, truncated } };
  }

  return { resolveRoleMembers };
}
