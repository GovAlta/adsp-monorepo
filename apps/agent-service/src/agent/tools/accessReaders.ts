import type { ServiceDirectory, User } from '@abgov/adsp-service-sdk';
import {
  createClientReader,
  createRoleAssignmentResolver,
  createRoleIndexBuilder,
  createRoleMemberResolver,
  createRoleReader,
  createServiceRoleCatalogReader,
  createUserReader,
  createUserResolver,
  matchServiceIds,
  ServiceRoleDefinitions,
} from '../agents/access/discovery';
import { displayText, optionalString } from '../agents/access/discovery/values';
import { createClientLookup } from './accessClientLookup';
import type { InspectionTarget } from './accessToolSupport';
import { createUserLookup } from './accessUserLookup';

/**
 * Creates the read-only Keycloak and configuration readers the Access tools share.
 */
export function createAccessReaders({ directory }: { directory: ServiceDirectory }) {
  const userReader = createUserReader();
  const clientReader = createClientReader();
  const roleReader = createRoleReader();
  const catalogReader = createServiceRoleCatalogReader({ directory });

  return {
    userReader,
    clientReader,
    roleReader,
    catalogReader,
    userLookup: createUserLookup(createUserResolver(userReader, clientReader), userReader),
    clientLookup: createClientLookup(clientReader),
    roleAssignments: createRoleAssignmentResolver(userReader),
    roleIndex: createRoleIndexBuilder({ clientReader, roleReader, userReader }),
    roleMembers: createRoleMemberResolver(roleReader),
  };
}

export type AccessReaders = ReturnType<typeof createAccessReaders>;

export interface ResolvedServices {
  definitions: ServiceRoleDefinitions[];
  notes: string[];
}

const CATALOG_UNAVAILABLE_NOTE =
  'The ADSP service role list could not be read, so roles were taken from the Keycloak client instead and have no ' +
  'descriptions.';

/**
 * Resolves a service named in plain words, such as "forms", to the roles it defines: from the ADSP service role
 * catalog when the service is registered there, otherwise from the Keycloak client with a matching client ID.
 */
export async function resolveServiceDefinitions(
  { catalogReader, clientReader, roleReader }: AccessReaders,
  target: InspectionTarget,
  user: User,
  text: string,
): Promise<ResolvedServices> {
  const notes: string[] = [];
  const catalog = await catalogReader.getCatalog(user);
  if (catalog.ok === true) {
    const matched = matchServiceIds(
      catalog.value.map((entry) => entry.service),
      text,
    );
    if (matched.length > 0) {
      return {
        notes,
        definitions: matched.map((service) => {
          const entries = catalog.value.filter((entry) => entry.service === service);
          return {
            service,
            rolesFrom: entries[0].source,
            roles: entries.flatMap((entry) => entry.roles),
          };
        }),
      };
    }
  } else {
    notes.push(CATALOG_UNAVAILABLE_NOTE);
  }

  const clients = await clientReader.listAllClients(target.reader);
  if (clients.ok === false) {
    return { notes, definitions: [] };
  }

  const clientIds = new Map(
    clients.value
      .map((client) => [optionalString(client.clientId), optionalString(client.id)] as const)
      .filter(([clientId, id]) => !!clientId && !!id),
  );
  const matched = matchServiceIds([...clientIds.keys()], text);
  const definitions = await Promise.all(
    matched.map(async (service): Promise<ServiceRoleDefinitions> => {
      const roles = await roleReader.listClientRoles(target.reader, clientIds.get(service));
      return {
        service,
        rolesFrom: 'client',
        roles:
          roles.ok === true
            ? roles.value
                .flatMap((role) => {
                  const name = optionalString(role.name);
                  const description = displayText(role.description);
                  return name ? [{ role: name, ...(description ? { description } : {}) }] : [];
                })
                .sort((left, right) => left.role.localeCompare(right.role))
            : [],
      };
    }),
  );
  return { notes, definitions };
}
