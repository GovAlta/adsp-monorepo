import {
  AdspId,
  DomainEvent,
  hasRequiredRole,
  Tenant,
  TenantService,
  UnauthorizedUserError,
  User,
} from '@abgov/adsp-service-sdk';
import {
  assertValidOverrides,
  ATTRIBUTES,
  ClientSecretRotationConfiguration,
  deriveStatus,
  revokePreviousSecret,
  RealmRotationOverrides,
  resolveRealmSettings,
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
import { ClientSecretRotationRoles } from './roles';

const DAY_MS = 24 * 60 * 60 * 1000;
const EMAIL = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
// Keycloak limits the length of a client attribute value.
const MAX_CONTACTS_LENGTH = 255;
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
  keycloak: RotationKeycloakClient;
  tenantService: Pick<TenantService, 'getTenantByRealm'>;
  settingsStore: RealmSettingsStore;
  eventService: RotationEventSender;
  getConfiguration: () => Promise<ClientSecretRotationConfiguration>;
  /** Renews the short-lived Keycloak token, called before each request. */
  refresh: () => Promise<void>;
  /** Client ids hidden from the API, such as the rotation service's own client. */
  skipClientIds: string[];
  now?: () => Date;
}

interface RealmContext {
  realm: string;
  tenantId?: AdspId;
}

interface RealmSettings {
  mode: RotationMode;
  expiryDays: number;
  noticeWindowDays: number;
  rotatedSecretOverlapDays: number;
  minNoticeGapDays: number;
}

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
  keycloak,
  tenantService,
  settingsStore,
  eventService,
  getConfiguration,
  refresh,
  skipClientIds,
  now = () => new Date(),
}: RotationRouterProps): Router {
  // Admins act on their own realm. Core users name the realm. Nobody reaches the master realm.
  const resolveRealm: RequestHandler = (req, _res, next) => {
    (async () => {
      const user = req.user as User;
      if (
        !hasRequiredRole(user, [ClientSecretRotationRoles.ClientSecretAdmin, ClientSecretRotationRoles.TenantAdmin])
      ) {
        throw new UnauthorizedUserError('manage client secret rotation', user);
      }

      const requested = typeof req.query.realm === 'string' ? req.query.realm : undefined;
      let context: RealmContext;
      if (user.isCore) {
        if (!requested) {
          throw new InvalidOperationError('The realm query parameter is required.');
        }
        if (requested === 'master') {
          throw new UnauthorizedUserError('manage client secret rotation', user);
        }
        if (requested === 'core') {
          const { coreNotificationTenantId } = await getConfiguration();
          context = {
            realm: requested,
            tenantId: coreNotificationTenantId ? AdspId.parse(coreNotificationTenantId) : undefined,
          };
        } else {
          const tenant: Tenant = await tenantService.getTenantByRealm(requested);
          if (!tenant) {
            throw new NotFoundError('Realm', requested);
          }
          context = { realm: tenant.realm, tenantId: tenant.id };
        }
      } else {
        const tenant = req.tenant;
        if (!tenant?.realm || (requested && requested !== tenant.realm)) {
          throw new UnauthorizedUserError('manage client secret rotation', user);
        }
        context = { realm: tenant.realm, tenantId: tenant.id };
      }

      (req as RotationRequest)[rotationContext] = context;
      await refresh();
    })().then(() => next(), next);
  };

  const withRealm = (
    handler: (req: RotationRequest, res: Response, context: RealmContext) => Promise<void>,
  ): RequestHandler[] => [
    resolveRealm,
    wrap((req, res) => handler(req, res, (req as RotationRequest)[rotationContext])),
  ];

  const getSettings = async ({ realm, tenantId }: RealmContext) => {
    const config = await getConfiguration();
    if (realm === 'core') {
      return { config, tenantConfig: undefined, settings: toSettings(config.coreRealmMode, config, undefined) };
    }
    const tenantConfig = await settingsStore.get(tenantId);
    // Keycloak's policy is the source of truth: tenants only choose On (opt-in per client) or Off,
    // and a stored legacy 'all' is read as On.
    const policyEnabled = await keycloak.isPolicyEnabled(realm);
    const stored = tenantConfig?.realmMode === 'all' ? 'selected' : tenantConfig?.realmMode;
    const realmMode = policyEnabled ? (toRotationMode(stored) === 'off' ? 'selected' : stored) : 'off';
    return { config, tenantConfig, settings: toSettings(realmMode, config, tenantConfig) };
  };

  const toSettings = (
    mode: unknown,
    config: ClientSecretRotationConfiguration,
    overrides: RealmRotationOverrides | undefined,
  ): RealmSettings => ({ mode: toRotationMode(mode), ...resolveRealmSettings(config, overrides) });

  const raise = async (
    { realm, tenantId }: RealmContext,
    name: string,
    clientId: string,
    payload: Record<string, unknown> = {},
  ) => {
    if (!tenantId) {
      logger.warn(`No tenant to raise ${name} for realm ${realm}.`);
      return;
    }
    await eventService.send({
      tenantId,
      name,
      timestamp: now(),
      context: { realm, clientId },
      payload: { realm, clientId, ...payload },
    });
  };

  const getClient = async (realm: string, clientId: string) => {
    const client = await keycloak.getClient(realm, clientId);
    if (!client || skipClientIds.includes(client.clientId)) {
      throw new NotFoundError('Client', clientId);
    }
    return client;
  };

  const assertCovered = (mode: RotationMode, client: { optedIn: boolean }) => {
    if (!(mode === 'all' || (mode === 'selected' && client.optedIn))) {
      throw new InvalidOperationError('Client is not covered by rotation in this realm.');
    }
  };

  const toClientResponse = (client: RotationClient & { optedIn: boolean }, mode: RotationMode, at: Date) => {
    const covered = mode === 'all' || (mode === 'selected' && client.optedIn);
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

  const toRealmResponse = (realm: string, settings: RealmSettings, config: ClientSecretRotationConfiguration) => ({
    mode: settings.mode,
    expiryDays: settings.expiryDays,
    noticeWindowDays: settings.noticeWindowDays,
    rotatedSecretOverlapDays: settings.rotatedSecretOverlapDays,
    minNoticeGapDays: settings.minNoticeGapDays,
    // The core realm is configured by platform administrators in the service configuration.
    editable: realm !== 'core',
    defaults: {
      expiryDays: config.expiryDays,
      noticeWindowDays: config.noticeWindowDays,
      rotatedSecretOverlapDays: config.rotatedSecretOverlapDays,
    },
  });

  // Turning rotation off must not leave secrets that expire with nothing rotating them. This runs after the
  // response; a failure is logged and left for the next job run, which clears the same attributes for clients
  // in realms whose policy is off or missing.
  const clearAttributes = { [ATTRIBUTES.expiry]: null, [ATTRIBUTES.rotatedExpiry]: null };
  const clearExpiries = async (realm: string) => {
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

  const router = Router();

  router.get(
    '/realm',
    ...withRealm(async (_req, res, context) => {
      const { config, settings } = await getSettings(context);
      res.json(toRealmResponse(context.realm, settings, config));
    }),
  );

  router.put(
    '/realm',
    ...withRealm(async (req, res, context) => {
      const { realm, tenantId } = context;
      if (realm === 'core') {
        throw new InvalidOperationError('Rotation of the core realm is configured in the service configuration.');
      }

      const { mode, expiryDays, noticeWindowDays, rotatedSecretOverlapDays } = req.body ?? {};
      if (mode !== undefined && !TENANT_ROTATION_MODES.includes(mode)) {
        throw new InvalidOperationError(`mode must be one of ${TENANT_ROTATION_MODES.join(', ')}.`);
      }
      const submitted: RealmRotationOverrides = { expiryDays, noticeWindowDays, rotatedSecretOverlapDays };
      invalid(() => assertValidOverrides(submitted));

      const { config, tenantConfig, settings: current } = await getSettings(context);
      const values: TenantRotationConfiguration = {
        ...(mode !== undefined ? { realmMode: mode } : {}),
        ...Object.fromEntries(Object.entries(submitted).filter(([, value]) => value !== undefined)),
      };
      // Check the combined schedule before saving, so a bad value never reaches the Keycloak policy.
      // A schedule-only save keeps the mode Keycloak is in, so it never re-enables a disabled policy.
      let settings!: RealmSettings;
      invalid(() => {
        settings = toSettings(values.realmMode ?? current.mode, config, { ...tenantConfig, ...values });
      });

      if (mode && mode !== 'off' && (await keycloak.countRealmAdminContacts(realm)) < 1) {
        throw new InvalidOperationError('Rotation requires at least one realm admin with an email address.');
      }

      await settingsStore.update(tenantId, values);
      await keycloak.ensurePolicy(realm, settings.expiryDays, settings.rotatedSecretOverlapDays, settings.mode);
      if (mode === 'off') {
        clearExpiries(realm).catch((err) => logger.warn(`Failed to clear expiries in realm ${realm}: ${err}`));
      }
      logger.info(`Rotation settings changed for realm ${realm} (mode ${settings.mode}).`);
      res.json(toRealmResponse(realm, settings, config));
    }),
  );

  router.get(
    '/clients',
    ...withRealm(async (_req, res, context) => {
      const { settings } = await getSettings(context);
      const clients = await keycloak.listClients(context.realm, skipClientIds);
      const at = now();
      res.json(clients.map((client) => toClientResponse(client, settings.mode, at)));
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
      const client = await getClient(context.realm, req.params.clientId);
      if (enabled && (await keycloak.countRealmAdminContacts(context.realm)) < 1) {
        throw new InvalidOperationError('Rotation requires at least one realm admin with an email address.');
      }
      await keycloak.setOptIn(context.realm, client.clientId, enabled);
      if (!enabled && (client.state.expiry || client.state.rotatedExpiry)) {
        await keycloak.setAttributes(context.realm, client.id, clearAttributes);
      }
      logger.info(`Rotation ${enabled ? 'enabled' : 'disabled'} for ${context.realm}/${client.clientId}.`);
      res.json(toClientResponse({ ...(await getClient(context.realm, client.clientId)) }, settings.mode, now()));
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
      const client = await getClient(context.realm, req.params.clientId);
      await keycloak.setAttributes(context.realm, client.id, { [ATTRIBUTES.contact]: value || null });
      const { settings } = await getSettings(context);
      res.json(toClientResponse(await getClient(context.realm, client.clientId), settings.mode, now()));
    }),
  );

  router.post(
    '/clients/:clientId/rotate',
    ...withRealm(async (req, res, context) => {
      const { settings } = await getSettings(context);
      const client = await getClient(context.realm, req.params.clientId);
      assertCovered(settings.mode, client);

      const { expiry, overlapEndsAt } = await rotateClient(keycloak, context.realm, client, now());
      await raise(context, 'client-secret-rotated', client.clientId, {
        newExpiry: expiry?.toISOString(),
        overlapEndsAt: overlapEndsAt?.toISOString(),
        emergency: false,
      });
      logger.info(`Secret rotated for ${context.realm}/${client.clientId} by ${(req.user as User)?.name}.`);
      // The new secret is never returned; the client's owner reads it in Keycloak.
      res.json({ expiresAt: expiry?.toISOString(), rotatedSecretExpiresAt: overlapEndsAt?.toISOString() });
    }),
  );

  router.post(
    '/clients/:clientId/invalidate-previous',
    ...withRealm(async (req, res, context) => {
      const client = await getClient(context.realm, req.params.clientId);
      const at = now();
      if (!client.state.rotatedExpiry || client.state.rotatedExpiry <= at) {
        throw new InvalidOperationError('Client has no previous secret to invalidate.');
      }
      await revokePreviousSecret(keycloak, context.realm, client, at);
      await raise(context, 'client-secret-revoked', client.clientId, { revokedAt: at.toISOString() });
      logger.info(
        `Previous secret invalidated for ${context.realm}/${client.clientId} by ${(req.user as User)?.name}.`,
      );
      res.json({ expiresAt: client.state.expiry?.toISOString() });
    }),
  );

  router.post(
    '/clients/:clientId/notify',
    ...withRealm(async (req, res, context) => {
      const { settings } = await getSettings(context);
      const client = await getClient(context.realm, req.params.clientId);
      assertCovered(settings.mode, client);
      const { expiry } = client.state;
      if (!expiry) {
        throw new InvalidOperationError('Client secret has no expiry to notify about.');
      }
      const at = now();
      await raise(context, 'client-secret-rotation-due', client.clientId, {
        expiry: expiry.toISOString(),
        daysRemaining: Math.max(0, Math.ceil((expiry.getTime() - at.getTime()) / DAY_MS)),
      });
      await keycloak.setAttributes(context.realm, client.id, {
        [ATTRIBUTES.noticeSentFor]: expiry.toISOString(),
        [ATTRIBUTES.noticeSentAt]: at.toISOString(),
      });
      res.json({ notifiedAt: at.toISOString() });
    }),
  );

  return router;
}
