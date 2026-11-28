import { AdspId, instrumentJob } from '@abgov/adsp-service-sdk';
import {
  ATTRIBUTES,
  ClientSecretRotationConfiguration,
  ClientSecretRotationEventNames,
  decideRotation,
  RotationKeycloakClient,
  TenantRotationConfiguration,
} from '@core-services/client-secret-rotation';
import * as schedule from 'node-schedule';
import { Logger } from 'winston';
import { TenantEntity, TenantRepository } from '../../tenant';
import { getClientCredentialsUrl, RotationLinks } from '../links';
import type { RotationEventSender } from '../router';

const LOG_CONTEXT = { context: 'ClientSecretRotationNotifyJob' };
const DAY_SECONDS = 24 * 60 * 60;
const DAY_MS = DAY_SECONDS * 1000;

interface DueItem {
  clientId: string;
  expiry: string;
  daysRemaining: number;
  keycloakUrl?: string;
}

interface RevokedItem {
  clientId: string;
  revokedAt: string;
  keycloakUrl?: string;
}

interface Marker {
  id: string;
  clientId: string;
  values: Record<string, string>;
}

interface RealmNotices {
  due: DueItem[];
  revoked: RevokedItem[];
  markers: Marker[];
}

type SendNotice = (
  name: string,
  context: Record<string, string>,
  payload: Record<string, unknown>,
) => Promise<void> | void;

interface SendContext {
  realm: string;
  at: Date;
  send: SendNotice;
  logger: Logger;
}

type NoticeClient = Awaited<ReturnType<RotationKeycloakClient['listClients']>>[number];

/** Sends the per-client notices a client is due, and records them (with their markers) in `notices`. */
async function sendClientNotices(
  { realm, at, send, logger }: SendContext,
  client: NoticeClient,
  actions: ReturnType<typeof decideRotation>,
  link: { keycloakUrl?: string },
  notices: RealmNotices,
): Promise<void> {
  for (const action of actions) {
    try {
      if (action.type === 'notice' && !action.onboarding) {
        const item = {
          clientId: client.clientId,
          expiry: action.dueAt.toISOString(),
          daysRemaining: Math.max(0, Math.floor((action.dueAt.getTime() - at.getTime()) / DAY_MS)),
          ...link,
        };
        await send(ClientSecretRotationEventNames.due, { clientId: client.clientId }, item);
        notices.due.push(item);
        notices.markers.push({
          id: client.id,
          clientId: client.clientId,
          values: { [ATTRIBUTES.noticeSentFor]: item.expiry, [ATTRIBUTES.noticeSentAt]: at.toISOString() },
        });
      } else if (action.type === 'revoked-notice') {
        const item = { clientId: client.clientId, revokedAt: action.revokedAt.toISOString(), ...link };
        await send(ClientSecretRotationEventNames.revoked, { clientId: client.clientId }, item);
        notices.revoked.push(item);
        notices.markers.push({
          id: client.id,
          clientId: client.clientId,
          values: { [ATTRIBUTES.revokedNoticeSentFor]: action.rotatedAt.toISOString() },
        });
      }
    } catch (err) {
      logger.error(`Failed to notify about ${realm}/${client.clientId}: ${err}`, LOG_CONTEXT);
    }
  }
}

export interface ClientSecretRotationNotifyJobProps {
  logger: Logger;
  tenantRepository: Pick<TenantRepository, 'find'>;
  /** Signs in as the notifier service account with a token scoped to the realm. Called once per realm per run. */
  createKeycloak: (realm: string) => Promise<RotationKeycloakClient>;
  settingsStore: { get(tenantId: AdspId): Promise<TenantRotationConfiguration> };
  eventService: RotationEventSender;
  getConfiguration: () => Promise<ClientSecretRotationConfiguration>;
  links?: RotationLinks;
  now?: () => Date;
}

/**
 * Sends the due and revoked notices that depend on time. It never rotates a secret: the Keycloak policy does that.
 * Contacts get an email per client; realm admins get one digest per realm per run. The per-client events carry only
 * the client id and the digest only the realm, so no admin is notified twice for the same client.
 */
export function createClientSecretNotifyJob({
  logger,
  tenantRepository,
  createKeycloak,
  settingsStore,
  eventService,
  getConfiguration,
  links,
  now = () => new Date(),
}: ClientSecretRotationNotifyJobProps) {
  let active = false;
  const { keycloakUrl: keycloakRoot, ...otherLinks } = links ?? {};

  const notifyRealm = async (keycloak: RotationKeycloakClient, tenant: TenantEntity): Promise<number> => {
    const { realm } = tenant;
    const tenantId = AdspId.parse(`urn:ads:platform:tenant-service:v2:/tenants/${tenant.id}`);

    // Realms follow their Keycloak policy: off or missing means rotation is not in use there.
    if (!(await keycloak.isPolicyEnabled(realm))) {
      return 0;
    }

    const config = await getConfiguration();
    const tenantConfig = await settingsStore.get(tenantId);
    const noticeWindowDays =
      tenantConfig?.noticePeriod > 0 ? tenantConfig.noticePeriod / DAY_SECONDS : config.noticeWindowDays;

    const at = now();
    const notices: RealmNotices = { due: [], revoked: [], markers: [] };

    const send: SendNotice = (name, context, payload) =>
      eventService.send({ tenantId, name, timestamp: at, context, payload: { realm, ...otherLinks, ...payload } });

    const clients = (await keycloak.listClients(realm)).filter((client) => client.optedIn);
    for (const client of clients) {
      const link = keycloakRoot ? { keycloakUrl: getClientCredentialsUrl(keycloakRoot, realm, client.id) } : {};
      const actions = decideRotation(client.state, { ...config, noticeWindowDays }, at);
      await sendClientNotices({ realm, at, send, logger }, client, actions, link, notices);
    }

    const { due, revoked, markers } = notices;
    if (!due.length && !revoked.length) {
      return 0;
    }

    // Markers are set only after the realm's events are sent, so a failure is retried on the next run.
    await send(ClientSecretRotationEventNames.digest, { realm }, { due, revoked });
    for (const { id, clientId, values } of markers) {
      try {
        await keycloak.setAttributes(realm, id, values);
      } catch (err) {
        logger.error(`Failed to record notice for ${realm}/${clientId}: ${err}`, LOG_CONTEXT);
      }
    }

    return due.length + revoked.length;
  };

  return async (): Promise<void> => {
    if (active) {
      logger.warn('Previous client secret rotation notify run is still in progress; skipping.', LOG_CONTEXT);
      return;
    }

    active = true;
    try {
      const tenants = await tenantRepository.find({ statusEquals: 'active' });

      let notices = 0;
      for (const tenant of tenants) {
        try {
          // A token per realm, so it carries only that realm's roles.
          notices += await notifyRealm(await createKeycloak(tenant.realm), tenant);
        } catch (err) {
          logger.error(`Failed to process realm ${tenant.realm}: ${err}`, LOG_CONTEXT);
        }
      }
      logger.info(`Sent ${notices} client secret rotation notice(s) across ${tenants.length} tenant(s).`, LOG_CONTEXT);
    } finally {
      active = false;
    }
  };
}

export function scheduleClientSecretNotifyJob(
  props: ClientSecretRotationNotifyJobProps & { cron: string },
): schedule.Job {
  const job = schedule.scheduleJob(
    { rule: props.cron, tz: 'Etc/UTC' },
    instrumentJob('client-secret-rotation-notify', createClientSecretNotifyJob(props), { logger: props.logger }),
  );
  if (!job) {
    throw new Error(`Invalid client secret rotation notify schedule: ${props.cron}`);
  }

  props.logger.info(`Scheduled client secret rotation notify job: ${props.cron} (UTC).`, LOG_CONTEXT);
  return job;
}
