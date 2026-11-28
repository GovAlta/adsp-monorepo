import { AdspId, DomainEvent, hasRequiredRole, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import {
  ATTRIBUTES,
  ClientSecretRotationConfiguration,
  ClientSecretRotationEventNames as EventNames,
  deriveStatus,
  revokePreviousSecret,
  rotateClient,
  RotationClient,
  RotationKeycloakClient,
  RotationMode,
  TenantRotationConfiguration,
  toRotationMode,
} from '@core-services/client-secret-rotation';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import type { Logger } from 'winston';
import { getClientCredentialsUrl } from './links';
import { ClientSecretRotationRoles } from './roles';
import type { SubscriptionSync } from './subscriptions';

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_SECONDS = 24 * 60 * 60;
// Domain labels exclude '.', so the pattern cannot backtrack polynomially.
const EMAIL = /^[^\s@,]+@[^\s@,.]+(?:\.[^\s@,.]+)+$/;
// Keycloak limits the length of a client attribute value.
const MAX_CONTACTS_LENGTH = 255;
const MIN_USER_SEARCH_LENGTH = 3;
const USER_SEARCH_LIMIT = 10;
const TENANT_ROTATION_MODES: RotationMode[] = ['off', 'selected'];

export interface RealmSettingsStore {
  get(tenantId: AdspId): Promise<TenantRotationConfiguration>;
  update(tenantId: AdspId, values: TenantRotationConfiguration): Promise<void>;
}

export interface RotationEventSender {
  send(event: DomainEvent): Promise<void> | void;
}

export interface RotationRouterProps {
  logger: Logger;
  /**
   * Creates the Keycloak client for a request. It acts with the signed-in admin's own token, so Keycloak enforces
   * that admin's realm-management permissions and the rotation service holds no Keycloak credential.
   */
  createKeycloak: (realm: string, bearer: string) => RotationKeycloakClient;
  settingsStore: RealmSettingsStore;
  eventService: RotationEventSender;
  getConfiguration: () => Promise<ClientSecretRotationConfiguration>;
  /** Links added to every event. keycloakUrl is the Keycloak root; events get the client's Credentials page. */
  links?: { portalUrl?: string; runbookUrl?: string; keycloakUrl?: string };
  /** Keeps the notification subscriptions in step with realm admins and client contacts. */
  subscriptions?: SubscriptionSync;
  /** Client ids hidden from the API, such as the rotation service's own client. */
  skipClientIds: string[];
  now?: () => Date;
}

interface RealmContext {
  realm: string;
  tenantId: AdspId;
  bearer: string;
  /** The signed-in admin, recorded on every event as the audit trail of who made the change. */
  actor: { id: string; name: string };
  keycloak: RotationKeycloakClient;
}

interface RealmSettings {
  mode: RotationMode;
  /** Seconds, as in the Keycloak executor. */
  expirationPeriod: number;
  /** Seconds the previous secret keeps working after a rotation. */
  rotatedExpirationPeriod: number;
  /** Seconds before expiry that contacts are notified. */
  noticePeriod: number;
  minNoticeGapDays: number;
}

const hasScheduleChanged = (before: RealmSettings, after: RealmSettings) =>
  before.expirationPeriod !== after.expirationPeriod ||
  before.rotatedExpirationPeriod !== after.rotatedExpirationPeriod ||
  before.noticePeriod !== after.noticePeriod;

const rotationContext = Symbol('rotationContext');
type RotationRequest = Request & { [rotationContext]?: RealmContext };

const wrap =
  (handler: (req: RotationRequest, res: Response) => Promise<void>): RequestHandler =>
  (req, res, next: NextFunction) => {
    handler(req as RotationRequest, res).catch(next);
  };

const invalid = (action: () => void) => {
  try {
    action();
  } catch (err) {
    throw new InvalidOperationError(err instanceof Error ? err.message : 'Invalid request.');
  }
};

export function createRotationRouter({
  logger,
  createKeycloak,
  settingsStore,
  eventService,
  getConfiguration,
  links,
  subscriptions,
  skipClientIds,
  now = () => new Date(),
}: RotationRouterProps): Router {
  // Tenant admins act on their own realm with their own token. Core users and the master realm are not reachable.
  const resolveRealm: RequestHandler = (req, _res, next) => {
    try {
      const user = req.user as User;
      const tenant = req.tenant;
      if (
        user.isCore ||
        !hasRequiredRole(user, [ClientSecretRotationRoles.ClientSecretAdmin, ClientSecretRotationRoles.TenantAdmin]) ||
        !tenant?.realm ||
        !user.token?.bearer
      ) {
        throw new UnauthorizedUserError('manage client secret rotation', user);
      }

      (req as RotationRequest)[rotationContext] = {
        realm: tenant.realm,
        tenantId: tenant.id,
        bearer: user.token.bearer,
        actor: { id: user.id, name: user.name },
        keycloak: createKeycloak(tenant.realm, user.token.bearer),
      };
      next();
    } catch (err) {
      next(err);
    }
  };

  const withRealm = (
    handler: (req: RotationRequest, res: Response, context: RealmContext) => Promise<void>,
  ): RequestHandler[] => [
    resolveRealm,
    wrap((req, res) => handler(req, res, (req as RotationRequest)[rotationContext])),
  ];

  const getSettings = async ({ keycloak, realm, tenantId }: RealmContext) => {
    const config = await getConfiguration();
    const tenantConfig = await settingsStore.get(tenantId);
    // Keycloak's policy is the source of truth: tenants only choose On (opt-in per client) or Off.
    const policyEnabled = await keycloak.isPolicyEnabled(realm);
    // The executor in Keycloak holds the expiration periods; the platform defaults apply until one exists.
    const enforced = await keycloak.getPolicySchedule(realm);
    const noticePeriod =
      tenantConfig?.noticePeriod > 0 ? tenantConfig.noticePeriod : config.noticeWindowDays * DAY_SECONDS;
    const settings: RealmSettings = {
      mode: policyEnabled ? 'selected' : 'off',
      expirationPeriod: enforced?.expirationPeriod ?? config.expiryDays * DAY_SECONDS,
      rotatedExpirationPeriod: enforced?.rotatedExpirationPeriod ?? config.rotatedSecretOverlapDays * DAY_SECONDS,
      noticePeriod,
      minNoticeGapDays: config.minNoticeGapDays,
    };
    return { config, tenantConfig, settings };
  };

  // All three periods are seconds, as in Keycloak.
  const assertValidSettings = ({ expirationPeriod, rotatedExpirationPeriod, noticePeriod }: RealmSettings) => {
    if (rotatedExpirationPeriod >= expirationPeriod) {
      throw new Error('rotatedExpirationPeriod must be less than expirationPeriod.');
    }
    if (noticePeriod >= expirationPeriod) {
      throw new Error('noticePeriod must be shorter than expirationPeriod.');
    }
  };

  const assertWholeNumber = (name: string, value: unknown, minimum: number) => {
    if (value !== undefined && !(Number.isInteger(value) && (value as number) >= minimum)) {
      throw new Error(
        minimum === 0 ? `${name} must be a whole number of 0 or more.` : `${name} must be a whole number above zero.`,
      );
    }
  };

  const raise = async (
    { realm, tenantId, actor }: RealmContext,
    name: string,
    { id, clientId }: { id: string; clientId: string },
    payload: Record<string, unknown> = {},
  ) => {
    const { keycloakUrl, ...otherLinks } = links ?? {};
    await eventService.send({
      tenantId,
      name,
      timestamp: now(),
      context: { realm, clientId },
      payload: {
        realm,
        clientId,
        updatedBy: actor,
        ...otherLinks,
        ...(keycloakUrl ? { keycloakUrl: getClientCredentialsUrl(keycloakUrl, realm, id) } : {}),
        ...payload,
      },
    });
  };

  // The change is already applied in Keycloak, so a failed event must not fail the request and invite a retry.
  const raiseAfterChange = async (...args: Parameters<typeof raise>) => {
    try {
      await raise(...args);
    } catch (err) {
      logger.warn(`Failed to send ${args[1]} event for ${args[0].realm}/${args[2].clientId}: ${err}`);
    }
  };

  // Realm-level audit events carry only the realm in their context, so they never reach per-client subscribers.
  const raiseRealmAfterChange = async (
    { realm, tenantId, actor }: RealmContext,
    name: string,
    payload: Record<string, unknown> = {},
  ) => {
    try {
      await eventService.send({
        tenantId,
        name,
        timestamp: now(),
        context: { realm },
        payload: { realm, updatedBy: actor, ...payload },
      });
    } catch (err) {
      logger.warn(`Failed to send ${name} event for realm ${realm}: ${err}`);
    }
  };

  const getClient = async ({ keycloak, realm }: RealmContext, clientId: string) => {
    const client = await keycloak.getClient(realm, clientId);
    if (!client || skipClientIds.includes(client.clientId)) {
      throw new NotFoundError('Client', clientId);
    }
    return client;
  };

  const assertCovered = (mode: RotationMode, client: { optedIn: boolean }) => {
    if (!(mode === 'selected' && client.optedIn)) {
      throw new InvalidOperationError('Client is not covered by rotation in this realm.');
    }
  };

  const toClientResponse = (client: RotationClient & { optedIn: boolean }, mode: RotationMode, at: Date) => {
    const covered = mode === 'selected' && client.optedIn;
    return {
      id: client.id,
      clientId: client.clientId,
      // Keycloak returns an empty string for clients without a display name.
      name: client.name || undefined,
      optedIn: client.optedIn,
      covered,
      expiresAt: client.state.expiry?.toISOString(),
      rotatedSecretExpiresAt: client.state.rotatedExpiry?.toISOString(),
      lastRotatedAt: client.state.lastRotated?.toISOString(),
      contacts: client.contacts,
      status: covered ? deriveStatus(client.state, at) : 'ok',
    };
  };

  const toRealmResponse = (settings: RealmSettings, config: ClientSecretRotationConfiguration) => ({
    mode: settings.mode,
    expirationPeriod: settings.expirationPeriod,
    rotatedExpirationPeriod: settings.rotatedExpirationPeriod,
    noticePeriod: settings.noticePeriod,
    minNoticeGapDays: settings.minNoticeGapDays,
    defaults: {
      expirationPeriod: config.expiryDays * DAY_SECONDS,
      rotatedExpirationPeriod: config.rotatedSecretOverlapDays * DAY_SECONDS,
      noticePeriod: config.noticeWindowDays * DAY_SECONDS,
    },
  });

  // Turning rotation off must not leave secrets that expire with nothing rotating them. This runs after the
  // response; a failure is logged and left for the next job run, which clears the same attributes for clients
  // in realms whose policy is off or missing.
  const clearAttributes = { [ATTRIBUTES.expiry]: null, [ATTRIBUTES.rotatedExpiry]: null };
  const clearExpiries = async ({ keycloak, realm }: RealmContext) => {
    const clients = await keycloak.listClients(realm, skipClientIds);
    for (const client of clients) {
      if (!client.state.expiry && !client.state.rotatedExpiry) {
        continue;
      }
      try {
        await keycloak.setAttributes(realm, client.id, clearAttributes);
      } catch (err) {
        logger.warn(`Failed to clear expiry for ${realm}/${client.clientId}: ${err}`);
      }
    }
  };

  // Runs after the response, like clearExpiries: the change is already made, so a failure is logged, not returned.
  const syncSubscriptions = ({ keycloak, realm, tenantId, bearer }: RealmContext) => {
    if (!subscriptions) {
      return;
    }
    Promise.resolve()
      .then(async () => {
        const [admins, clients] = await Promise.all([
          keycloak.listRealmAdmins(realm),
          keycloak.listClients(realm, skipClientIds),
        ]);
        await subscriptions.sync(
          tenantId,
          {
            realm,
            admins: admins.map(({ email, name }) => ({ email, name })),
            clients: clients
              .filter(({ contacts }) => contacts?.length > 0)
              .map(({ clientId, contacts }) => ({ clientId, contacts })),
          },
          bearer,
        );
      })
      .catch((err) => logger.warn(`Failed to sync rotation subscriptions for realm ${realm}: ${err}`));
  };

  const router = Router();

  router.get(
    '/realm',
    ...withRealm(async (_req, res, context) => {
      const { config, settings } = await getSettings(context);
      res.json(toRealmResponse(settings, config));
    }),
  );

  router.put(
    '/realm',
    ...withRealm(async (req, res, context) => {
      const { keycloak, realm, tenantId } = context;
      const { mode, expirationPeriod, rotatedExpirationPeriod, noticePeriod } = req.body ?? {};
      if (mode !== undefined && !TENANT_ROTATION_MODES.includes(mode)) {
        throw new InvalidOperationError(`mode must be one of ${TENANT_ROTATION_MODES.join(', ')}.`);
      }
      invalid(() => {
        assertWholeNumber('expirationPeriod', expirationPeriod, 1);
        assertWholeNumber('rotatedExpirationPeriod', rotatedExpirationPeriod, 0);
        assertWholeNumber('noticePeriod', noticePeriod, 1);
      });

      const { config, settings: current } = await getSettings(context);
      const values: TenantRotationConfiguration = {
        ...(mode !== undefined ? { realmMode: mode } : {}),
        ...(noticePeriod !== undefined ? { noticePeriod } : {}),
      };
      // Check the combined schedule before saving, so a bad value never reaches the Keycloak policy.
      // A schedule-only save keeps the mode Keycloak is in, so it never re-enables a disabled policy.
      const settings: RealmSettings = {
        ...current,
        mode: toRotationMode(mode ?? current.mode),
        ...(expirationPeriod !== undefined ? { expirationPeriod } : {}),
        ...(rotatedExpirationPeriod !== undefined ? { rotatedExpirationPeriod } : {}),
        ...(noticePeriod !== undefined ? { noticePeriod } : {}),
      };
      invalid(() => assertValidSettings(settings));

      if (mode && mode !== 'off' && (await keycloak.countRealmAdminContacts(realm)) < 1) {
        throw new InvalidOperationError('Rotation requires at least one realm admin with an email address.');
      }

      // Keycloak is the source of truth, so change it first: a failure then leaves the stored settings untouched.
      await keycloak.ensurePolicy(realm, settings.expirationPeriod, settings.rotatedExpirationPeriod, settings.mode);
      await settingsStore.update(tenantId, values);
      if (mode === 'off') {
        clearExpiries(context).catch((err) => logger.warn(`Failed to clear expiries in realm ${realm}: ${err}`));
      }
      logger.info(`Rotation settings changed for realm ${realm} (mode ${settings.mode}).`);
      if (settings.mode !== current.mode) {
        await raiseRealmAfterChange(
          context,
          settings.mode === 'off' ? EventNames.realmDisabled : EventNames.realmEnabled,
        );
      }
      if (hasScheduleChanged(current, settings)) {
        await raiseRealmAfterChange(context, EventNames.scheduleUpdated, {
          expirationPeriod: settings.expirationPeriod,
          rotatedExpirationPeriod: settings.rotatedExpirationPeriod,
          noticePeriod: settings.noticePeriod,
        });
      }
      if (settings.mode === 'selected') {
        syncSubscriptions(context);
      }
      res.json(toRealmResponse(settings, config));
    }),
  );

  router.get(
    '/clients',
    ...withRealm(async (_req, res, context) => {
      const { settings } = await getSettings(context);
      const clients = await context.keycloak.listClients(context.realm, skipClientIds);
      const at = now();
      res.json(clients.map((client) => toClientResponse(client, settings.mode, at)));
    }),
  );

  router.get(
    '/users',
    ...withRealm(async (req, res, context) => {
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      if (search.length < MIN_USER_SEARCH_LENGTH) {
        throw new InvalidOperationError(`search must be at least ${MIN_USER_SEARCH_LENGTH} characters.`);
      }
      res.json(await context.keycloak.searchUsers(context.realm, search, USER_SEARCH_LIMIT));
    }),
  );

  router.put(
    '/clients/:clientId/opt-in',
    ...withRealm(async (req, res, context) => {
      const { enabled } = req.body ?? {};
      if (typeof enabled !== 'boolean') {
        throw new InvalidOperationError('enabled must be true or false.');
      }
      const { settings } = await getSettings(context);
      if (settings.mode !== 'selected') {
        throw new InvalidOperationError('Clients opt in only when the realm rotates selected clients.');
      }
      const { keycloak } = context;
      const client = await getClient(context, req.params.clientId);
      if (enabled && (await keycloak.countRealmAdminContacts(context.realm)) < 1) {
        throw new InvalidOperationError('Rotation requires at least one realm admin with an email address.');
      }
      await keycloak.setOptIn(context.realm, client.clientId, enabled);
      if (!enabled && (client.state.expiry || client.state.rotatedExpiry)) {
        await keycloak.setAttributes(context.realm, client.id, clearAttributes);
      }
      logger.info(`Rotation ${enabled ? 'enabled' : 'disabled'} for ${context.realm}/${client.clientId}.`);
      await raiseAfterChange(context, enabled ? EventNames.enabled : EventNames.disabled, client);
      syncSubscriptions(context);
      res.json(toClientResponse(await getClient(context, client.clientId), settings.mode, now()));
    }),
  );

  router.patch(
    '/clients/:clientId',
    ...withRealm(async (req, res, context) => {
      const { contacts } = req.body ?? {};
      if (
        !Array.isArray(contacts) ||
        contacts.some((contact) => typeof contact !== 'string' || !EMAIL.test(contact.trim()))
      ) {
        throw new InvalidOperationError('contacts must be a list of email addresses.');
      }
      const value = contacts.map((contact: string) => contact.trim()).join(',');
      if (value.length > MAX_CONTACTS_LENGTH) {
        throw new InvalidOperationError(`contacts must total no more than ${MAX_CONTACTS_LENGTH} characters.`);
      }
      const client = await getClient(context, req.params.clientId);
      await context.keycloak.setAttributes(context.realm, client.id, { [ATTRIBUTES.contact]: value || null });
      await raiseRealmAfterChange(context, EventNames.contactsUpdated, {
        clientId: client.clientId,
        contactCount: contacts.length,
      });
      const { settings } = await getSettings(context);
      syncSubscriptions(context);
      res.json(toClientResponse(await getClient(context, client.clientId), settings.mode, now()));
    }),
  );

  router.post(
    '/clients/:clientId/rotate',
    ...withRealm(async (req, res, context) => {
      const { settings } = await getSettings(context);
      const client = await getClient(context, req.params.clientId);
      assertCovered(settings.mode, client);

      const { expiry, overlapEndsAt } = await rotateClient(context.keycloak, context.realm, client, now());
      await raiseAfterChange(context, EventNames.rotated, client, {
        newExpiry: expiry?.toISOString(),
        overlapEndsAt: overlapEndsAt?.toISOString(),
      });
      logger.info(`Secret rotated for ${context.realm}/${client.clientId} by ${(req.user as User)?.name}.`);
      // The new secret is never returned; the client's owner reads it in Keycloak.
      res.json(toClientResponse(await getClient(context, client.clientId), settings.mode, now()));
    }),
  );

  router.post(
    '/clients/:clientId/invalidate-previous',
    ...withRealm(async (req, res, context) => {
      const client = await getClient(context, req.params.clientId);
      const at = now();
      if (!client.state.rotatedExpiry || client.state.rotatedExpiry <= at) {
        throw new InvalidOperationError('Client has no previous secret to invalidate.');
      }
      await revokePreviousSecret(context.keycloak, context.realm, client, at);
      await raiseAfterChange(context, EventNames.revoked, client, { revokedAt: at.toISOString() });
      logger.info(
        `Previous secret invalidated for ${context.realm}/${client.clientId} by ${(req.user as User)?.name}.`,
      );
      const { settings } = await getSettings(context);
      res.json(toClientResponse(await getClient(context, client.clientId), settings.mode, now()));
    }),
  );

  router.post(
    '/clients/:clientId/notify',
    ...withRealm(async (req, res, context) => {
      const { settings } = await getSettings(context);
      const client = await getClient(context, req.params.clientId);
      assertCovered(settings.mode, client);
      const { expiry } = client.state;
      if (!expiry) {
        throw new InvalidOperationError('Client secret has no expiry to notify about.');
      }
      const at = now();
      await raise(context, EventNames.due, client, {
        expiry: expiry.toISOString(),
        daysRemaining: Math.max(0, Math.floor((expiry.getTime() - at.getTime()) / DAY_MS)),
      });
      await context.keycloak.setAttributes(context.realm, client.id, {
        [ATTRIBUTES.noticeSentFor]: expiry.toISOString(),
        [ATTRIBUTES.noticeSentAt]: at.toISOString(),
      });
      res.json({ notifiedAt: at.toISOString() });
    }),
  );

  return router;
}
