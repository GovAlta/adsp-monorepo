import { adspId, ServiceDirectory, User } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import z from 'zod';
import { mapRequestError, RealmClientResult } from './realmClient';
import { ACCESS_REQUEST_TIMEOUT_MS } from './types';
import { asRecord, displayText, optionalString, recordList } from './values';

/**
 * The ADSP service role catalog: the roles each platform and tenant service registers with tenant-service
 * configuration, with their descriptions and whether tenant-admin includes them. This is the same catalog the
 * tenant admin app shows on its Service roles tab.
 */

export const accessServiceRoleSchema = z.object({
  role: z.string(),
  description: z.string().optional(),
  inTenantAdmin: z.boolean(),
});

export const accessServiceRolesEntrySchema = z.object({
  service: z.string(),
  source: z.enum(['platform', 'tenant']),
  roles: z.array(accessServiceRoleSchema),
});

export interface AccessServiceRole {
  role: string;
  description?: string;
  inTenantAdmin: boolean;
}

export interface ServiceRolesEntry {
  service: string;
  source: 'platform' | 'tenant';
  roles: AccessServiceRole[];
}

const CATALOG_PATH = 'v2/configuration/platform/tenant-service';

function toEntries(configuration: unknown, source: ServiceRolesEntry['source']): ServiceRolesEntry[] {
  return Object.entries(asRecord(configuration))
    .map(([service, value]) => ({
      service,
      source,
      roles: recordList(asRecord(value).roles)
        .flatMap((role): AccessServiceRole[] => {
          const name = optionalString(role.role);
          const description = displayText(role.description);
          return name
            ? [{ role: name, ...(description ? { description } : {}), inTenantAdmin: role.inTenantAdmin === true }]
            : [];
        })
        .sort((left, right) => left.role.localeCompare(right.role)),
    }))
    .filter((entry) => entry.roles.length > 0);
}

interface ServiceRoleCatalogProps {
  directory: ServiceDirectory;
}

export function createServiceRoleCatalogReader({ directory }: ServiceRoleCatalogProps) {
  async function readConfiguration(user: User, core: boolean): Promise<RealmClientResult<unknown>> {
    const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
    const url = new URL(CATALOG_PATH, configurationServiceUrl);
    try {
      const { data } = await axios.get<unknown>(url.href, {
        headers: { Authorization: `Bearer ${user.token.bearer}` },
        params: core ? { core: true } : undefined,
        timeout: ACCESS_REQUEST_TIMEOUT_MS,
      });
      return { ok: true, value: asRecord(asRecord(asRecord(data).latest).configuration) };
    } catch (err) {
      const problem = mapRequestError(err, { forbidden: 'NO_ROLE_CATALOG_ACCESS', notFound: 'SERVICE_NOT_FOUND' });
      // A tenant that has registered no roles of its own has no configuration yet.
      return problem.reason === 'SERVICE_NOT_FOUND' ? { ok: true, value: {} } : { ok: false, problem };
    }
  }

  /**
   * Reads the platform and tenant service roles with the user's own token, so configuration-service enforces its own
   * access rules. Platform entries come first; a tenant entry for the same service follows its platform entry.
   */
  async function getCatalog(user: User): Promise<RealmClientResult<ServiceRolesEntry[]>> {
    const [platform, tenant] = await Promise.all([readConfiguration(user, true), readConfiguration(user, false)]);
    if (platform.ok === false) {
      return platform;
    }
    if (tenant.ok === false) {
      return tenant;
    }

    const entries = [...toEntries(platform.value, 'platform'), ...toEntries(tenant.value, 'tenant')];
    return { ok: true, value: entries.sort((left, right) => left.service.localeCompare(right.service)) };
  }

  return { getCatalog };
}

export type ServiceRoleCatalogReader = ReturnType<typeof createServiceRoleCatalogReader>;

const URN_PREFIX = /^urn:ads:[^:]+:/;
const KIND_SUFFIX = /-(service|app|gateway|api)$/;

/**
 * The short name of a service from its URN or client ID, for example form-service from urn:ads:platform:form-service.
 */
export function serviceShortName(serviceId: string): string {
  return serviceId.toLowerCase().replace(URN_PREFIX, '').split(':')[0];
}

function stem(text: string): string {
  return text.replace(KIND_SUFFIX, '').replace(/s$/, '');
}

/**
 * Turns how a beginner names a service ("forms", "Notification Service", "form-service") into the stem used to match
 * service URNs and client IDs.
 */
export function normalizeServiceText(text: string): string {
  return stem(
    serviceShortName(text.trim())
      .replace(/\s+/g, '-')
      .replace(/-?(service|app|gateway|api)s?$/, '')
      .replace(/-+$/, ''),
  );
}

export const MAX_MATCHED_SERVICES = 3;

/**
 * Finds the service IDs a plain-language service name refers to, best matches first: an exact ID, then services
 * whose name stem equals the text, then those whose name starts with it, then those containing it.
 */
export function matchServiceIds(serviceIds: string[], text: string): string[] {
  const requested = text.trim().toLowerCase();
  const exact = serviceIds.find((id) => id.toLowerCase() === requested);
  if (exact) {
    return [exact];
  }

  const wanted = normalizeServiceText(requested);
  if (!wanted) {
    return [];
  }

  const unique = [...new Set(serviceIds)];
  const tiers = [
    unique.filter((id) => stem(serviceShortName(id)) === wanted),
    unique.filter((id) => serviceShortName(id).startsWith(wanted)),
    unique.filter((id) => serviceShortName(id).includes(wanted)),
  ];
  const match = tiers.find((tier) => tier.length > 0) ?? [];
  // Prefer platform service URNs over tenant clients with similar names.
  return match
    .sort((left, right) => left.length - right.length || left.localeCompare(right))
    .slice(0, MAX_MATCHED_SERVICES);
}
