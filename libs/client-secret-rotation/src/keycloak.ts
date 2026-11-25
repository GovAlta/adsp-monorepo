import type KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import type ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import { ClientRotationState } from './decision';
import type { RotationMode } from './configuration';
import {
  ATTRIBUTES,
  CONDITION_ACCESS_TYPE,
  CONDITION_CLIENT_ROLES,
  ROTATION_EXECUTOR,
  ROTATION_POLICY,
  ROTATION_PROFILE,
  ROTATION_ROLE,
  TENANT_ADMIN_ROLE,
  TENANT_SERVICE_CLIENT_ID,
} from './constants';

export * from './constants';

const DAY_SECONDS = 24 * 60 * 60;

// Key-order-insensitive comparison; Keycloak reorders keys and adds defaults when it returns policies.
function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

export interface RotationClient {
  id: string;
  clientId: string;
  name?: string;
  contacts: string[];
  state: ClientRotationState;
}

// Keycloak stores `client.secret.*.time` as epoch seconds and our markers as ISO strings; accept both.
export function parseTimestamp(value?: string): Date | undefined {
  if (!value) {
    return undefined;
  }
  const date = /^\d+$/.test(value) ? new Date(Number(value) * 1000) : new Date(value);
  return isNaN(date.getTime()) ? undefined : date;
}

export function toState(attributes: Record<string, string> = {}): ClientRotationState {
  return {
    expiry: parseTimestamp(attributes[ATTRIBUTES.expiry]),
    rotatedExpiry: parseTimestamp(attributes[ATTRIBUTES.rotatedExpiry]),
    noticeSentFor: parseTimestamp(attributes[ATTRIBUTES.noticeSentFor]),
    noticeSentAt: parseTimestamp(attributes[ATTRIBUTES.noticeSentAt]),
    lastRotated: parseTimestamp(attributes[ATTRIBUTES.lastRotated]),
    revokedNoticeSentFor: parseTimestamp(attributes[ATTRIBUTES.revokedNoticeSentFor]),
  };
}

function toContacts(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((contact) => contact.trim())
    .filter((contact) => !!contact);
}

/** Keycloak Admin API operations used by the rotation job and API. Never returns a secret. */
export class RotationKeycloakClient {
  constructor(private readonly client: KeycloakAdminClient) {}

  async listRealms(): Promise<string[]> {
    const realms = await this.client.realms.find({ briefRepresentation: true });
    return realms.map(({ realm }) => realm).filter((realm) => !!realm && realm !== 'master');
  }

  /**
   * Creates or updates the realm's profile and policy for the mode: `selected` limits it to clients with the
   * opt-in role, `all` covers every confidential client. For `off` it only disables an existing policy.
   */
  async ensurePolicy(
    realm: string,
    expiryDays: number,
    rotatedSecretOverlapDays: number,
    mode: RotationMode = 'selected',
  ): Promise<boolean> {
    if (mode === 'off') {
      return this.disablePolicy(realm);
    }

    const profiles = await this.client.clientPolicies.listProfiles({ realm });
    const policies = await this.client.clientPolicies.listPolicies({ realm });

    const profile = {
      name: ROTATION_PROFILE,
      description: 'ADSP client secret rotation',
      executors: [
        {
          executor: ROTATION_EXECUTOR,
          configuration: {
            'expiration-period': String(expiryDays * DAY_SECONDS),
            'rotated-expiration-period': String(rotatedSecretOverlapDays * DAY_SECONDS),
            // Keycloak 25 rejects the profile without this; equal to the expiry period lets rotation happen at any time.
            'remaining-rotation-period': String(expiryDays * DAY_SECONDS),
          },
        },
      ],
    };
    const policy = {
      name: ROTATION_POLICY,
      description:
        mode === 'all'
          ? 'ADSP client secret rotation, for all confidential clients'
          : 'ADSP client secret rotation, for clients with the rotation-enabled role',
      enabled: true,
      profiles: [ROTATION_PROFILE],
      conditions: [
        { condition: CONDITION_ACCESS_TYPE, configuration: { 'is-negative-logic': false, type: ['confidential'] } },
        ...(mode === 'selected'
          ? [
              {
                condition: CONDITION_CLIENT_ROLES,
                configuration: { 'is-negative-logic': false, roles: [ROTATION_ROLE] },
              },
            ]
          : []),
      ],
    };

    const currentProfile = profiles.profiles?.find(({ name }) => name === ROTATION_PROFILE);
    const currentPolicy = policies.policies?.find(({ name }) => name === ROTATION_POLICY);
    const profileChanged = stableStringify(currentProfile?.executors) !== stableStringify(profile.executors);
    const policyChanged = stableStringify(currentPolicy) !== stableStringify(policy);

    if (profileChanged) {
      const others = (profiles.profiles ?? []).filter(({ name }) => name !== ROTATION_PROFILE);
      await this.client.clientPolicies.createProfiles({ realm, profiles: [...others, profile] });
    }
    if (policyChanged) {
      const others = (policies.policies ?? []).filter(({ name }) => name !== ROTATION_POLICY);
      await this.client.clientPolicies.updatePolicy({ realm, policies: [...others, policy] });
    }
    return profileChanged || policyChanged;
  }

  /** Whether the realm has an enabled ADSP rotation policy. */
  async isPolicyEnabled(realm: string): Promise<boolean> {
    const { policies } = await this.client.clientPolicies.listPolicies({ realm });
    return !!policies?.find(({ name }) => name === ROTATION_POLICY)?.enabled;
  }

  /**
   * The mode the realm's policy is actually in: `off` when it is missing or disabled, `selected` when it only covers
   * clients with the opt-in role, otherwise `all`. Keycloak is the source of truth for tenant realms.
   */
  async getPolicyMode(realm: string): Promise<RotationMode> {
    const { policies } = await this.client.clientPolicies.listPolicies({ realm });
    const current = policies?.find(({ name }) => name === ROTATION_POLICY);
    if (!current?.enabled) {
      return 'off';
    }
    return current.conditions?.some(({ condition }) => condition === CONDITION_CLIENT_ROLES) ? 'selected' : 'all';
  }

  /** Whether the ADSP rotation policy exists but has been switched off (a missing policy is not disabled). */
  async isPolicyDisabled(realm: string): Promise<boolean> {
    const { policies } = await this.client.clientPolicies.listPolicies({ realm });
    const current = policies?.find(({ name }) => name === ROTATION_POLICY);
    return !!current && !current.enabled;
  }

  /** Disables the realm's ADSP rotation policy, if enabled. Returns whether it changed. */
  async disablePolicy(realm: string): Promise<boolean> {
    const { policies = [] } = await this.client.clientPolicies.listPolicies({ realm });
    const current = policies.find(({ name }) => name === ROTATION_POLICY);
    if (!current?.enabled) {
      return false;
    }
    const others = policies.filter(({ name }) => name !== ROTATION_POLICY);
    await this.client.clientPolicies.updatePolicy({ realm, policies: [...others, { ...current, enabled: false }] });
    return true;
  }

  /** Confidential clients, with whether each holds the opt-in role. Skips the named clients. */
  async listClients(realm: string, skip: string[] = []): Promise<(RotationClient & { optedIn: boolean })[]> {
    const clients = await this.client.clients.find({ realm, max: 1000 });
    const results: (RotationClient & { optedIn: boolean })[] = [];
    for (const client of clients) {
      if (client.publicClient || client.bearerOnly || skip.includes(client.clientId) || !client.id) {
        continue;
      }
      const optedIn = await this.hasRole(realm, client);
      results.push({ ...this.toRotationClient(client), optedIn });
    }
    return results;
  }

  async getClient(realm: string, clientId: string): Promise<(RotationClient & { optedIn: boolean }) | undefined> {
    const [client] = await this.client.clients.find({ realm, clientId });
    return client?.id ? { ...this.toRotationClient(client), optedIn: await this.hasRole(realm, client) } : undefined;
  }

  async setOptIn(realm: string, clientId: string, enabled: boolean): Promise<void> {
    const [client] = await this.client.clients.find({ realm, clientId });
    if (!client?.id) {
      throw new Error(`Client ${clientId} not found in realm.`);
    }
    const existing = await this.client.clients.findRole({ realm, id: client.id, roleName: ROTATION_ROLE });
    if (enabled && !existing) {
      await this.client.clients.createRole({ realm, id: client.id, name: ROTATION_ROLE });
    } else if (!enabled && existing) {
      await this.client.clients.delRole({ realm, id: client.id, roleName: ROTATION_ROLE });
    }
  }

  /** Sets or clears attributes. A null value deletes the attribute. */
  async setAttributes(realm: string, id: string, values: Record<string, string | null>): Promise<void> {
    const client = await this.client.clients.findOne({ realm, id });
    const attributes = { ...(client.attributes ?? {}) };
    for (const [key, value] of Object.entries(values)) {
      if (value === null) {
        delete attributes[key];
      } else {
        attributes[key] = value;
      }
    }
    await this.client.clients.update({ realm, id }, { ...client, attributes });
  }

  /** Regenerates the secret. The response is discarded so a secret is never held or logged. */
  async regenerateSecret(realm: string, id: string): Promise<void> {
    await this.client.clients.generateNewClientSecret({ realm, id });
  }

  /** Deletes the previous (rotated) secret, ending the overlap early. The current secret is untouched. */
  async invalidatePreviousSecret(realm: string, id: string): Promise<void> {
    await this.client.clients.invalidateSecret({ realm, id });
  }

  /** Number of tenant admins with an email address. They are always notified, so rotation needs at least one. */
  async countRealmAdminContacts(realm: string): Promise<number> {
    const [tenantService] = await this.client.clients.find({ realm, clientId: TENANT_SERVICE_CLIENT_ID });
    if (!tenantService?.id) {
      return 0;
    }
    const admins = await this.client.clients.findUsersWithRole({
      realm,
      id: tenantService.id,
      roleName: TENANT_ADMIN_ROLE,
      max: 1000,
    });
    return admins.filter(({ email, enabled }) => !!email && enabled !== false).length;
  }

  private async hasRole(realm: string, client: ClientRepresentation): Promise<boolean> {
    return !!(await this.client.clients.findRole({ realm, id: client.id as string, roleName: ROTATION_ROLE }));
  }

  private toRotationClient(client: ClientRepresentation): RotationClient {
    const attributes = (client.attributes ?? {}) as Record<string, string>;
    return {
      id: client.id as string,
      clientId: client.clientId as string,
      name: client.name,
      contacts: toContacts(attributes[ATTRIBUTES.contact]),
      state: toState(attributes),
    };
  }
}
