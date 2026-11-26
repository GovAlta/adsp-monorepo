import { adspId, AdspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { NOTIFICATION_TYPE_ID } from '@core-services/client-secret-rotation';
import axios from 'axios';
import type { Logger } from 'winston';
import { MANAGED_DESCRIPTION, SUBSCRIPTION_PAGE_SIZE } from './constants';

const NOTIFICATION_API_ID = adspId`urn:ads:platform:notification-service:v1`;
const LOG_CONTEXT = { context: 'RotationSubscriptions' };

export interface SubscriptionCriteria {
  description?: string;
  correlationId?: string;
  context?: Record<string, string>;
}

export interface Recipient {
  email: string;
  name?: string;
}

export interface RealmRecipients {
  realm: string;
  /** Realm admins are notified about every client. */
  admins: Recipient[];
  /** Contacts are notified about their own client only. */
  clients: { clientId: string; contacts: string[] }[];
}

export interface PlannedSubscription extends Recipient {
  criteria: SubscriptionCriteria[];
}

export interface SubscriptionSync {
  /** Makes the rotation subscriptions of the tenant match its realm admins and client contacts. */
  sync(tenantId: AdspId, recipients: RealmRecipients, bearer: string): Promise<void>;
}

const isManaged = (criteria: SubscriptionCriteria) => !!criteria.description?.startsWith(MANAGED_DESCRIPTION);

const criteriaKey = (criteria: SubscriptionCriteria) =>
  JSON.stringify([
    criteria.description ?? '',
    criteria.correlationId ?? '',
    Object.entries(criteria.context ?? {}).sort(([a], [b]) => a.localeCompare(b)),
  ]);

const sameCriteria = (a: SubscriptionCriteria[], b: SubscriptionCriteria[]) =>
  JSON.stringify(a.map(criteriaKey).sort()) === JSON.stringify(b.map(criteriaKey).sort());

/** Who should be subscribed, keyed by lower case email. An admin covers every client, so needs no per-client criteria. */
export function planSubscriptions({ realm, admins, clients }: RealmRecipients): Map<string, PlannedSubscription> {
  const plan = new Map<string, PlannedSubscription>();
  for (const { email, name } of admins) {
    plan.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      name,
      criteria: [{ description: `${MANAGED_DESCRIPTION} (all clients)`, context: { realm } }],
    });
  }
  for (const { clientId, contacts } of clients) {
    for (const contact of contacts) {
      const email = contact.toLowerCase();
      const entry = plan.get(email) ?? { email, criteria: [] };
      const coversAll = entry.criteria.some(({ context }) => !context?.clientId);
      if (!coversAll && !entry.criteria.some(({ context }) => context?.clientId === clientId)) {
        entry.criteria.push({ description: MANAGED_DESCRIPTION, context: { clientId } });
      }
      plan.set(email, entry);
    }
  }
  return plan;
}

interface ExistingSubscription {
  subscriberId: string;
  subscriber?: { channels?: { channel: string; address: string }[] };
  criteria?: SubscriptionCriteria | SubscriptionCriteria[];
}

class NotificationSubscriptionSync implements SubscriptionSync {
  constructor(
    private readonly logger: Logger,
    private readonly directory: ServiceDirectory,
  ) {}

  async sync(tenantId: AdspId, recipients: RealmRecipients, bearer: string): Promise<void> {
    const apiUrl = await this.directory.getServiceUrl(NOTIFICATION_API_ID);
    const headers = { Authorization: `Bearer ${bearer}` };
    const typeUrl = (path = '') => new URL(`v1/types/${NOTIFICATION_TYPE_ID}/subscriptions${path}`, apiUrl).href;
    const subscriberUrl = (path = '') => new URL(`v1/subscribers${path}`, apiUrl).href;

    const existing = await this.listSubscriptions(typeUrl(), headers);
    const byEmail = new Map<string, ExistingSubscription>();
    for (const subscription of existing) {
      for (const { channel, address } of subscription.subscriber?.channels ?? []) {
        if (channel === 'email') {
          byEmail.set(address.toLowerCase(), subscription);
        }
      }
    }

    const setCriteria = (subscriberId: string, criteria: SubscriptionCriteria[]) =>
      axios.post(typeUrl(`/${subscriberId}`), { criteria }, { headers });

    const plan = planSubscriptions(recipients);
    let failures = 0;
    for (const planned of plan.values()) {
      try {
        const current = byEmail.get(planned.email);
        if (current) {
          const kept = toList(current.criteria).filter((criteria) => !isManaged(criteria));
          const desired = [...kept, ...planned.criteria];
          if (!sameCriteria(toList(current.criteria), desired)) {
            await setCriteria(current.subscriberId, desired);
          }
          continue;
        }

        const subscriberId = await this.getOrCreateSubscriber(subscriberUrl, headers, planned);
        // A new subscription takes a single criteria; further criteria are added by replacing the list.
        const [first, ...rest] = planned.criteria;
        await axios.post(typeUrl(`/${subscriberId}`), { criteria: first }, { headers });
        if (rest.length > 0) {
          await setCriteria(subscriberId, planned.criteria);
        }
      } catch (err) {
        failures++;
        this.logger.warn(`Failed to subscribe ${planned.email} to rotation notifications: ${err}`, {
          ...LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
      }
    }

    // Subscriptions this sync created for people who are no longer admins or contacts.
    for (const [email, current] of byEmail) {
      if (plan.has(email) || !toList(current.criteria).some(isManaged)) {
        continue;
      }
      try {
        const kept = toList(current.criteria).filter((criteria) => !isManaged(criteria));
        if (kept.length > 0) {
          await setCriteria(current.subscriberId, kept);
        } else {
          await axios.delete(typeUrl(`/${current.subscriberId}`), { headers });
        }
      } catch (err) {
        failures++;
        this.logger.warn(`Failed to unsubscribe ${email} from rotation notifications: ${err}`, {
          ...LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
      }
    }

    this.logger.info(
      `Synced rotation notification subscriptions of ${recipients.realm}: ${plan.size} recipients, ${failures} failures.`,
      { ...LOG_CONTEXT, tenant: tenantId?.toString() },
    );
  }

  private async listSubscriptions(url: string, headers: Record<string, string>): Promise<ExistingSubscription[]> {
    const results: ExistingSubscription[] = [];
    let after: string | undefined;
    do {
      const { data } = await axios.get<{ results: ExistingSubscription[]; page?: { next?: string } }>(url, {
        headers,
        params: { top: SUBSCRIPTION_PAGE_SIZE, after },
      });
      results.push(...(data.results ?? []));
      after = data.page?.next;
    } while (after);
    return results;
  }

  private async getOrCreateSubscriber(
    subscriberUrl: (path?: string) => string,
    headers: Record<string, string>,
    { email, name }: Recipient,
  ): Promise<string> {
    // The email filter is a pattern match, so confirm the address.
    const { data: found } = await axios.get<{ results: { id: string; channels?: { address: string }[] }[] }>(
      subscriberUrl(),
      { headers, params: { email, top: SUBSCRIPTION_PAGE_SIZE } },
    );
    const match = found.results?.find(({ channels }) =>
      channels?.some(({ address }) => address.toLowerCase() === email),
    );
    if (match) {
      return match.id;
    }

    const { data } = await axios.post<{ id: string }>(
      subscriberUrl(),
      { addressAs: name ?? email, channels: [{ channel: 'email', address: email }] },
      { headers },
    );
    return data.id;
  }
}

const toList = (criteria?: SubscriptionCriteria | SubscriptionCriteria[]): SubscriptionCriteria[] =>
  Array.isArray(criteria) ? criteria : criteria ? [criteria] : [];

export function createSubscriptionSync(logger: Logger, directory: ServiceDirectory): SubscriptionSync {
  return new NotificationSubscriptionSync(logger, directory);
}
