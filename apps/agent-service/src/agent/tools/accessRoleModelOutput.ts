import type {
  AccessRoleMember,
  AccessServiceCheck,
  AccessUserComparison,
  AccessUserRoles,
  RoleRef,
  RoleSource,
  ServiceRolesEntry,
} from '../agents/access/discovery';
import {
  capItems,
  describeItems,
  describeList,
  flag,
  joinParts,
  MAX_MODEL_LIST_ITEMS,
  ModelLine,
} from './accessModelOutput';

/**
 * Compact model views of roles and how they are held, shared by the Access user, client and role tools.
 */

interface HeldRole extends RoleRef {
  composite?: boolean;
  sources: RoleSource[];
}

interface RoleDetailsView extends RoleRef {
  description?: string;
  composite: boolean;
  inTenantAdmin?: boolean;
  includes: RoleRef[];
  includedIn: Array<RoleRef & { via: RoleRef[] }>;
  truncated?: boolean;
}

interface RoleMembersView {
  members?: AccessRoleMember[];
  counts?: { direct: number; group: number; composite: number };
  truncated?: boolean;
}

export function describeRoleRef({ name, client }: RoleRef): string {
  return client ? `${name} (${client})` : name;
}

// inTenantAdmin comes from the service's role registration: whether tenant-admin gets the role when a tenant is
// created. A realm's live tenant-admin composite can differ, so it is never described as "in tenant-admin".
const TENANT_ADMIN_DEFAULT_NOTE =
  "tenant-admin default: the service adds the role to tenant-admin for new tenants; this realm's tenant-admin can " +
  'differ, so use getAccessRole to say whether tenant-admin includes a role now';

function describeTenantAdminDefault(inTenantAdmin: boolean | undefined): string | undefined {
  return flag(inTenantAdmin, 'tenant-admin default', 'not a tenant-admin default');
}

function describeChain(via: RoleRef[] = []): string {
  return via.map(describeRoleRef).join(' > ');
}

function describeRoleSource({ type, group, via }: RoleSource): string {
  switch (type) {
    case 'direct':
      return 'direct';
    case 'group':
      return `group ${group}`;
    case 'composite':
      return joinParts([`via ${describeChain(via)}`, group && `from group ${group}`], ' ');
    default:
      return 'unresolved (source not traced)';
  }
}

function describeRoleSources(sources: RoleSource[]): string {
  return sources.map(describeRoleSource).join(' | ');
}

interface HeldRoleLine {
  container: string;
  sources: string;
  names: string[];
}

/**
 * Describes roles one line per client and way of holding them, so roles inherited together cost one line.
 */
function describeHeldRoles(roles: HeldRole[]): string[] {
  const lines = new Map<string, HeldRoleLine>();
  for (const role of roles) {
    const container = role.client ? `client ${role.client}` : 'realm';
    const sources = describeRoleSources(role.sources);
    const key = `${container}\n${sources}`;
    const line = lines.get(key) ?? { container, sources, names: [] };
    line.names.push(role.composite ? `${role.name} (composite)` : role.name);
    lines.set(key, line);
  }
  return capItems(
    [...lines.values()].map(
      ({ container, sources, names }) => `- ${container}: ${joinParts([names.join(', '), sources], ' ← ')}`,
    ),
  );
}

function describeHeldRoleList(label: string, roles: HeldRole[]): string[] {
  return roles.length > 0 ? [`${label} (${roles.length}):`, ...describeHeldRoles(roles)] : [`${label}: none`];
}

export function describeUserRoles(roles?: AccessUserRoles): ModelLine[] {
  if (!roles) {
    return [];
  }
  const { realmRoles, clientRoles, groups, counts, incomplete } = roles;
  return [
    `roles: ${counts.direct} direct, ${counts.inherited} inherited; ${describeList('groups', groups)}`,
    ...describeHeldRoles([
      ...realmRoles,
      ...clientRoles.flatMap(({ clientId, roles: held }) => held.map((role) => ({ ...role, client: clientId }))),
    ]),
    incomplete && 'incomplete: some inherited roles could not be traced, so the list may be incomplete',
  ];
}

function describeServiceRole({
  role,
  description,
  inTenantAdmin,
  has,
  sources,
  inToken,
}: AccessServiceCheck['roles'][number]): string {
  const held = has ? joinParts(['has', describeRoleSources(sources)], ' ← ') : 'missing';
  const facts = joinParts([held, describeTenantAdminDefault(inTenantAdmin), flag(inToken, 'in token')]);
  return `${role}: ${facts}${description ? ` — ${description}` : ''}`;
}

function describeServiceCheck({ service, rolesFrom, roles, otherRoles, token }: AccessServiceCheck): ModelLine[] {
  return [
    `service ${service} (roles from ${rolesFrom})`,
    token && `token from ${token.app}: ${flag(token.audienceIncluded, 'audience included', 'audience not included')}`,
    ...describeItems('service roles', roles.map(describeServiceRole)),
    otherRoles.length > 0 &&
      describeList(
        'other roles held on it',
        otherRoles.map(({ role, sources }) => `${role} ← ${describeRoleSources(sources)}`),
      ),
  ];
}

export function describeServiceChecks(services: AccessServiceCheck[] = []): ModelLine[] {
  return services.flatMap(describeServiceCheck);
}

export function describeComparison(comparison?: AccessUserComparison): ModelLine[] {
  if (!comparison) {
    return [];
  }
  const { onlyFirst, onlySecond, sharedCount, groups, truncated } = comparison;
  return [
    ...describeHeldRoleList('roles only first has', onlyFirst),
    ...describeHeldRoleList('roles only second has', onlySecond),
    `shared roles: ${sharedCount}`,
    describeList('groups only first is in', groups.onlyFirst),
    describeList('groups only second is in', groups.onlySecond),
    truncated && 'truncated: more differences exist or some inherited roles could not be traced',
  ];
}

export function describeRoleDetails(role?: RoleDetailsView): ModelLine[] {
  if (!role) {
    return [];
  }
  const { description, composite, inTenantAdmin, includes, includedIn, truncated } = role;
  const facts = joinParts([
    describeRoleRef(role),
    flag(composite, 'composite'),
    describeTenantAdminDefault(inTenantAdmin),
  ]);
  return [
    `role: ${facts}${description ? ` — ${description}` : ''}`,
    describeList('includes', includes.map(describeRoleRef)),
    describeList(
      'included in (outermost first)',
      includedIn.map((parent) => describeChain(parent.via.length > 0 ? parent.via : [parent])),
    ),
    truncated && 'truncated: the role lists are incomplete',
  ];
}

function describeMember({ username, serviceAccount, enabled, sources }: AccessRoleMember): string {
  const facts = joinParts([username, serviceAccount && 'service account', enabled === false && 'disabled']);
  return `${facts} ← ${describeRoleSources(sources)}`;
}

export function describeRoleMembers({ members, counts, truncated }: RoleMembersView): ModelLine[] {
  if (!members) {
    return [];
  }
  return [
    counts &&
      `held by: ${counts.direct} direct, ${counts.group} through a group, ${counts.composite} through a composite`,
    ...describeItems('members', members.map(describeMember)),
    truncated && 'truncated: more accounts hold it or some could not be read',
  ];
}

function describeCatalogEntry({ service, source, roles }: ServiceRolesEntry): string[] {
  return [
    `${service} (${source}):`,
    ...capItems(
      roles.map(
        ({ role, description, inTenantAdmin }) =>
          `- ${role} (${describeTenantAdminDefault(inTenantAdmin)})${description ? `: ${description}` : ''}`,
      ),
    ),
  ];
}

export function describeServiceRoleCatalog(services: ServiceRolesEntry[]): string[] {
  if (services.length === 0) {
    return ['services: none'];
  }
  const listed = services.slice(0, MAX_MODEL_LIST_ITEMS).flatMap(describeCatalogEntry);
  const more = services.length - MAX_MODEL_LIST_ITEMS;
  return [
    TENANT_ADMIN_DEFAULT_NOTE,
    ...(more > 0 ? [...listed, `…and ${more} more services (listed in the card)`] : listed),
  ];
}
