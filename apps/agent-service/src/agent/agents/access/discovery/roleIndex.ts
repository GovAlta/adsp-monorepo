import { AdminReadTarget, KeycloakRepresentation, mapWithConcurrency } from './adminRead';
import type { ClientReader } from './clientReader';
import type { RealmClientResult } from './realmClient';
import type { RoleRef } from './roleAssignments';
import type { RoleReader } from './roleReader';
import type { UserReader } from './userReader';
import { optionalString } from './values';

/**
 * An index of every realm and client role in the realm and which composite roles include which, built from bounded,
 * read-only scans. Keycloak has no lookup from a role to the composite roles that include it, so this is what answers
 * "what gives someone this role" and "who has this role, including through other roles".
 */

export const MAX_INDEX_CONCURRENCY = 10;
export const MAX_INDEXED_COMPOSITES = 200;

export interface IndexedRole extends RoleRef {
  id: string;
  /** Keycloak's internal ID of the client a client role belongs to. */
  clientUuid?: string;
  composite: boolean;
}

export interface RoleIndex {
  roles: Map<string, IndexedRole>;
  /** Role ID to the IDs of the composite roles that directly include it. */
  parents: Map<string, string[]>;
  /** Composite role ID to the IDs of the roles it directly includes. */
  children: Map<string, string[]>;
  incomplete: boolean;
}

function toIndexedRole(
  role: KeycloakRepresentation,
  client?: { uuid: string; clientId: string },
): IndexedRole | undefined {
  const id = optionalString(role.id);
  const name = optionalString(role.name);
  if (!id || !name) {
    return undefined;
  }
  return {
    id,
    name,
    ...(client ? { client: client.clientId, clientUuid: client.uuid } : {}),
    composite: role.composite === true,
  };
}

export function toRoleRef({ name, client }: IndexedRole): RoleRef {
  return client ? { name, client } : { name };
}

interface RoleIndexReaders {
  clientReader: ClientReader;
  roleReader: RoleReader;
  userReader: UserReader;
}

export function createRoleIndexBuilder({ clientReader, roleReader, userReader }: RoleIndexReaders) {
  async function buildRoleIndex(target: AdminReadTarget): Promise<RealmClientResult<RoleIndex>> {
    const [realmRoles, clients] = await Promise.all([
      roleReader.listRealmRoles(target),
      clientReader.listAllClients(target),
    ]);
    if (realmRoles.ok === false) {
      return realmRoles;
    }
    if (clients.ok === false) {
      return clients;
    }

    const roles = new Map<string, IndexedRole>();
    const add = (role?: IndexedRole) => role && roles.set(role.id, role);
    realmRoles.value.forEach((role) => add(toIndexedRole(role)));

    let incomplete = false;
    const clientRefs = clients.value
      .map((client) => ({ uuid: optionalString(client.id), clientId: optionalString(client.clientId) }))
      .filter((client): client is { uuid: string; clientId: string } => !!client.uuid && !!client.clientId);
    const clientRoles = await mapWithConcurrency(clientRefs, MAX_INDEX_CONCURRENCY, async (client) => ({
      client,
      result: await roleReader.listClientRoles(target, client.uuid),
    }));
    for (const { client, result } of clientRoles) {
      if (result.ok === false) {
        incomplete = true;
        continue;
      }
      result.value.forEach((role) => add(toIndexedRole(role, client)));
    }

    const composites = [...roles.values()].filter((role) => role.composite);
    incomplete = incomplete || composites.length > MAX_INDEXED_COMPOSITES;
    const expanded = await mapWithConcurrency(
      composites.slice(0, MAX_INDEXED_COMPOSITES),
      MAX_INDEX_CONCURRENCY,
      async (role) => ({ role, members: await userReader.getRoleComposites(target, role.id) }),
    );

    const parents = new Map<string, string[]>();
    const children = new Map<string, string[]>();
    for (const { role, members } of expanded) {
      if (members.ok === false) {
        incomplete = true;
        continue;
      }
      const memberIds = members.value.map((member) => optionalString(member.id)).filter((id) => !!id);
      children.set(role.id, memberIds);
      memberIds.forEach((memberId) => parents.set(memberId, [...(parents.get(memberId) ?? []), role.id]));
    }

    return { ok: true, value: { roles, parents, children, incomplete } };
  }

  return { buildRoleIndex };
}

export type RoleIndexBuilder = ReturnType<typeof createRoleIndexBuilder>;

/**
 * Finds roles by name, ignoring case, optionally only those of one client. A name given as "<client ID>:<role>", such
 * as urn:ads:platform:form-service:form-admin, is matched as that client's role.
 */
export function findRolesByName(index: RoleIndex, text: string, clientId?: string): IndexedRole[] {
  const requested = text.trim().toLowerCase();
  const all = [...index.roles.values()];
  const byName = (name: string, client?: string) =>
    all.filter(
      (role) =>
        role.name.toLowerCase() === name &&
        (client === undefined || role.client?.toLowerCase() === client.toLowerCase()),
    );

  if (clientId) {
    return byName(requested, clientId);
  }

  const separator = requested.lastIndexOf(':');
  if (separator > 0) {
    const qualified = byName(requested.slice(separator + 1), requested.slice(0, separator));
    if (qualified.length > 0) {
      return qualified;
    }
  }

  return byName(requested);
}

/**
 * Lists the composite roles that include the role, directly or through other composites, each with the chain of
 * roles from that composite down to (but not including) the role, outermost first. Breadth-first, so each records its
 * shortest chain.
 */
export function findIncludingRoles(index: RoleIndex, roleId: string): Array<{ role: IndexedRole; via: RoleRef[] }> {
  const found: Array<{ role: IndexedRole; via: RoleRef[] }> = [];
  const visited = new Set([roleId]);
  const queue: Array<{ id: string; below: RoleRef[] }> = [{ id: roleId, below: [] }];

  while (queue.length > 0) {
    const { id, below } = queue.shift();
    for (const parentId of index.parents.get(id) ?? []) {
      const parent = index.roles.get(parentId);
      if (!parent || visited.has(parentId)) {
        continue;
      }
      visited.add(parentId);
      const via = [toRoleRef(parent), ...below];
      found.push({ role: parent, via });
      queue.push({ id: parentId, below: via });
    }
  }

  return found;
}
