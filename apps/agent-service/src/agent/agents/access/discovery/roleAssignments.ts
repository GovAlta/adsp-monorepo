import type { AdminReadTarget, KeycloakRepresentation } from './adminRead';
import type { RealmClientResult } from './realmClient';
import type { UserReader } from './userReader';
import { asRecord, displayText, optionalString, recordList } from './values';

/**
 * Resolves a user's role assignments and where each one comes from: assigned directly, assigned to a group the user
 * belongs to (or its parent group), or inherited through a composite role. Every lookup is bounded, and anything that
 * could not be followed marks the result incomplete rather than being guessed.
 */

export const MAX_RESOLVED_GROUPS = 25;
export const MAX_RESOLVED_ROLES = 500;
export const MAX_COMPOSITE_DEPTH = 10;
export const MAX_SOURCES_PER_ROLE = 3;
export const MAX_CLIENT_LOOKUPS = 100;

export interface RoleRef {
  name: string;
  client?: string;
}

export type RoleSourceType = 'direct' | 'group' | 'composite' | 'unresolved';

export interface RoleSource {
  type: RoleSourceType;
  group?: string;
  via?: RoleRef[];
}

export interface ResolvedRole extends RoleRef {
  id: string;
  description?: string;
  composite: boolean;
  sources: RoleSource[];
}

export interface ResolvedRoleAssignments {
  roles: ResolvedRole[];
  /** Paths of the groups the user is a member of; roles from their parent groups are inherited too. */
  groups: string[];
  incomplete: boolean;
}

interface RoleNode {
  id: string;
  name: string;
  clientUuid?: string;
  description?: string;
  composite: boolean;
}

interface Seed {
  roleId: string;
  origin: RoleSource;
}

interface GroupRef {
  id?: string;
  path: string;
}

function toRoleNode(role: KeycloakRepresentation): RoleNode | undefined {
  const id = optionalString(role.id);
  const name = optionalString(role.name);
  if (!id || !name) {
    return undefined;
  }

  return {
    id,
    name,
    clientUuid: role.clientRole === true ? optionalString(role.containerId) : undefined,
    description: displayText(role.description),
    composite: role.composite === true,
  };
}

/**
 * Reads the roles in a role mappings representation, recording the client ID of each client it names.
 */
function readMappedRoles(mappings: KeycloakRepresentation, clientIds: Map<string, string>): RoleNode[] {
  const clientRoles = Object.values(asRecord(mappings.clientMappings)).flatMap((value) => {
    const entry = asRecord(value);
    const clientUuid = optionalString(entry.id);
    const clientId = optionalString(entry.client);
    if (clientUuid && clientId) {
      clientIds.set(clientUuid, clientId);
    }
    return recordList(entry.mappings).map((role) => ({ ...role, clientRole: true, containerId: clientUuid }));
  });

  return [...recordList(mappings.realmMappings), ...clientRoles]
    .map(toRoleNode)
    .filter((role): role is RoleNode => !!role);
}

function ancestorPaths(path: string): string[] {
  const segments = path.split('/').filter((segment) => segment !== '');
  return segments.slice(0, -1).map((_, index) => `/${segments.slice(0, index + 1).join('/')}`);
}

function sourceKey(source: RoleSource): string {
  return JSON.stringify([source.type, source.group, source.via?.map(({ name, client }) => [name, client])]);
}

const SOURCE_ORDER: Record<RoleSourceType, number> = { direct: 0, group: 1, composite: 2, unresolved: 3 };

function compareSources(left: RoleSource, right: RoleSource): number {
  return SOURCE_ORDER[left.type] - SOURCE_ORDER[right.type] || (left.via?.length ?? 0) - (right.via?.length ?? 0);
}

export function createRoleAssignmentResolver(reader: UserReader) {
  /**
   * Lists the user's groups and their parent groups, since members of a subgroup inherit its parents' roles.
   */
  async function resolveGroups(
    target: AdminReadTarget,
    memberships: KeycloakRepresentation[],
  ): Promise<{ groups: GroupRef[]; incomplete: boolean }> {
    const groupIds = new Map<string, string | undefined>();
    for (const membership of memberships) {
      const path = optionalString(membership.path);
      if (path) {
        groupIds.set(path, optionalString(membership.id));
      }
    }
    for (const path of [...groupIds.keys()]) {
      for (const ancestor of ancestorPaths(path)) {
        if (!groupIds.has(ancestor)) {
          groupIds.set(ancestor, undefined);
        }
      }
    }

    let incomplete = groupIds.size > MAX_RESOLVED_GROUPS;
    const groups: GroupRef[] = [...groupIds.entries()]
      .slice(0, MAX_RESOLVED_GROUPS)
      .map(([path, id]) => ({ path, id }));

    await Promise.all(
      groups
        .filter((group) => !group.id)
        .map(async (group) => {
          const found = await reader.getGroupByPath(target, group.path);
          group.id = found.ok === true ? optionalString(found.value.id) : undefined;
          incomplete = incomplete || !group.id;
        }),
    );

    return { groups, incomplete };
  }

  /**
   * Reads the members of every composite role reachable from the given roles, level by level, within the limits.
   */
  async function expandComposites(
    target: AdminReadTarget,
    roles: Map<string, RoleNode>,
  ): Promise<{ children: Map<string, string[]>; incomplete: boolean }> {
    const children = new Map<string, string[]>();
    let incomplete = false;
    let frontier = [...roles.values()].filter((role) => role.composite);

    for (let depth = 0; frontier.length > 0; depth++) {
      if (depth >= MAX_COMPOSITE_DEPTH) {
        return { children, incomplete: true };
      }

      const levels = await Promise.all(
        frontier.map(async (parent) => ({ parent, members: await reader.getRoleComposites(target, parent.id) })),
      );

      const next: RoleNode[] = [];
      for (const { parent, members } of levels) {
        if (members.ok === false) {
          incomplete = true;
          continue;
        }

        const memberIds: string[] = [];
        for (const member of members.value.map(toRoleNode).filter((role): role is RoleNode => !!role)) {
          memberIds.push(member.id);
          if (roles.has(member.id)) {
            continue;
          }
          if (roles.size >= MAX_RESOLVED_ROLES) {
            incomplete = true;
            continue;
          }
          roles.set(member.id, member);
          if (member.composite) {
            next.push(member);
          }
        }
        children.set(parent.id, memberIds);
      }
      frontier = next;
    }

    return { children, incomplete };
  }

  /**
   * Looks up the client ID of each client a role belongs to that the role mappings did not already name.
   */
  async function resolveClientIds(
    target: AdminReadTarget,
    roles: Iterable<RoleNode>,
    clientIds: Map<string, string>,
  ): Promise<void> {
    const unknown = [
      ...new Set([...roles].map((role) => role.clientUuid).filter((uuid) => uuid && !clientIds.has(uuid))),
    ].slice(0, MAX_CLIENT_LOOKUPS);

    await Promise.all(
      unknown.map(async (clientUuid) => {
        const client = await reader.getClient(target, clientUuid);
        const clientId = client.ok === true ? optionalString(client.value.clientId) : undefined;
        if (clientId) {
          clientIds.set(clientUuid, clientId);
        }
      }),
    );
  }

  async function resolveUserRoleAssignments(
    target: AdminReadTarget,
    userId: string,
  ): Promise<RealmClientResult<ResolvedRoleAssignments>> {
    const [directMappings, memberships] = await Promise.all([
      reader.getUserRoleMappings(target, userId),
      reader.getUserGroups(target, userId),
    ]);
    if (directMappings.ok === false) {
      return directMappings;
    }
    if (memberships.ok === false) {
      return memberships;
    }

    const clientIds = new Map<string, string>();
    const roles = new Map<string, RoleNode>();
    const seeds: Seed[] = [];
    const addSeeds = (mapped: RoleNode[], origin: RoleSource) => {
      for (const role of mapped) {
        roles.set(role.id, roles.get(role.id) ?? role);
        seeds.push({ roleId: role.id, origin });
      }
    };

    addSeeds(readMappedRoles(directMappings.value, clientIds), { type: 'direct' });

    const { groups, incomplete: groupsIncomplete } = await resolveGroups(target, memberships.value);
    const groupMappings = await Promise.all(
      groups
        .filter((group) => !!group.id)
        .map(async (group) => ({ group, mappings: await reader.getGroupRoleMappings(target, group.id) })),
    );
    let incomplete = groupsIncomplete;
    for (const { group, mappings } of groupMappings) {
      if (mappings.ok === false) {
        incomplete = true;
        continue;
      }
      addSeeds(readMappedRoles(mappings.value, clientIds), { type: 'group', group: group.path });
    }

    const [expansion, effectiveRealmRoles] = await Promise.all([
      expandComposites(target, roles),
      reader.getEffectiveRealmRoles(target, userId),
    ]);
    incomplete = incomplete || expansion.incomplete || effectiveRealmRoles.ok === false;

    // Realm roles Keycloak says are effective but that could not be traced to a source are still reported.
    const unresolvedIds = new Set<string>();
    if (effectiveRealmRoles.ok === true) {
      for (const role of effectiveRealmRoles.value.map(toRoleNode).filter((node): node is RoleNode => !!node)) {
        if (!roles.has(role.id)) {
          roles.set(role.id, role);
          unresolvedIds.add(role.id);
        }
      }
    }

    await resolveClientIds(target, roles.values(), clientIds);

    const toRef = (role: RoleNode): RoleRef =>
      role.clientUuid
        ? { name: role.name, client: clientIds.get(role.clientUuid) ?? role.clientUuid }
        : { name: role.name };

    const sources = new Map<string, Map<string, RoleSource>>();
    const addSource = (roleId: string, source: RoleSource) => {
      const roleSources = sources.get(roleId) ?? new Map<string, RoleSource>();
      roleSources.set(sourceKey(source), source);
      sources.set(roleId, roleSources);
    };

    for (const { roleId, origin } of seeds) {
      addSource(roleId, origin);

      // Breadth-first, so each inherited role records its shortest path from this assignment.
      const visited = new Set([roleId]);
      const queue: Array<{ id: string; path: RoleRef[] }> = [{ id: roleId, path: [toRef(roles.get(roleId))] }];
      while (queue.length > 0) {
        const { id, path } = queue.shift();
        for (const memberId of expansion.children.get(id) ?? []) {
          const member = roles.get(memberId);
          if (!member || visited.has(memberId)) {
            continue;
          }
          visited.add(memberId);
          addSource(memberId, { type: 'composite', via: path, ...(origin.group ? { group: origin.group } : {}) });
          queue.push({ id: memberId, path: [...path, toRef(member)] });
        }
      }
    }
    unresolvedIds.forEach((roleId) => addSource(roleId, { type: 'unresolved' }));

    const resolvedRoles = [...roles.values()]
      .filter((role) => sources.has(role.id))
      .map(
        (role): ResolvedRole => ({
          id: role.id,
          ...toRef(role),
          description: role.description,
          composite: role.composite,
          sources: [...sources.get(role.id).values()].sort(compareSources).slice(0, MAX_SOURCES_PER_ROLE),
        }),
      );

    return {
      ok: true,
      value: {
        roles: resolvedRoles,
        groups: memberships.value
          .map((membership) => optionalString(membership.path))
          .filter((path): path is string => !!path)
          .sort(),
        incomplete,
      },
    };
  }

  return { resolveUserRoleAssignments };
}
