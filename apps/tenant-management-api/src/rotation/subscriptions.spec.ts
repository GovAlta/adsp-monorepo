import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { MANAGED_DESCRIPTION } from './constants';
import { createSubscriptionSync, planSubscriptions } from './subscriptions';

jest.mock('axios');
const http = axios as jest.Mocked<typeof axios>;

const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
const directory = { getServiceUrl: jest.fn() };
const managed = (context: Record<string, string>, description = MANAGED_DESCRIPTION) => ({ description, context });

describe('planSubscriptions', () => {
  it('subscribes admins to the realm and contacts to their clients, ignoring email case', () => {
    const plan = planSubscriptions({
      realm: 'r',
      admins: [{ email: 'Admin@x.ca', name: 'Ad' }],
      clients: [
        { clientId: 'c1', contacts: ['Admin@x.ca', 'Bob@x.ca'] },
        { clientId: 'c2', contacts: ['bob@x.ca'] },
      ],
    });

    expect(plan.get('admin@x.ca').criteria).toEqual([managed({ realm: 'r' }, `${MANAGED_DESCRIPTION} (all clients)`)]);
    expect(plan.get('bob@x.ca').criteria).toEqual([managed({ clientId: 'c1' }), managed({ clientId: 'c2' })]);
  });
});

describe('NotificationSubscriptionSync', () => {
  const sync = createSubscriptionSync(logger as never, directory as never);
  const recipients = { realm: 'r', admins: [], clients: [{ clientId: 'c1', contacts: ['bob@x.ca'] }] };

  beforeEach(() => {
    jest.resetAllMocks();
    directory.getServiceUrl.mockResolvedValue(new URL('https://notification.test'));
    http.post.mockResolvedValue({ data: { id: 'new' } });
  });

  it('creates a subscriber and subscription for a new contact', async () => {
    http.get.mockResolvedValueOnce({ data: { results: [] } }).mockResolvedValueOnce({ data: { results: [] } });

    await sync.sync(tenantId, recipients, 'token');

    expect(http.post).toHaveBeenCalledWith(
      'https://notification.test/v1/subscribers',
      { addressAs: 'bob@x.ca', channels: [{ channel: 'email', address: 'bob@x.ca' }] },
      { headers: { Authorization: 'Bearer token' } },
    );
    expect(http.post).toHaveBeenCalledWith(
      'https://notification.test/v1/types/client-secret-rotation/subscriptions/new',
      { criteria: managed({ clientId: 'c1' }) },
      { headers: { Authorization: 'Bearer token' } },
    );
  });

  it('keeps manual criteria and removes stale managed ones for an existing subscriber', async () => {
    const manual = { context: { clientId: 'manual' } };
    http.get.mockResolvedValueOnce({
      data: {
        results: [
          {
            subscriberId: 's1',
            subscriber: { channels: [{ channel: 'email', address: 'Bob@x.ca' }] },
            criteria: [manual, managed({ clientId: 'old' })],
          },
        ],
      },
    });

    await sync.sync(tenantId, recipients, 'token');

    expect(http.post).toHaveBeenCalledWith(
      'https://notification.test/v1/types/client-secret-rotation/subscriptions/s1',
      { criteria: [manual, managed({ clientId: 'c1' })] },
      expect.anything(),
    );
  });

  it('does not call the API when the subscriptions already match', async () => {
    http.get.mockResolvedValueOnce({
      data: {
        results: [
          {
            subscriberId: 's1',
            subscriber: { channels: [{ channel: 'email', address: 'bob@x.ca' }] },
            criteria: managed({ clientId: 'c1' }),
          },
        ],
      },
    });

    await sync.sync(tenantId, recipients, 'token');

    expect(http.post).not.toHaveBeenCalled();
    expect(http.delete).not.toHaveBeenCalled();
  });

  it('deletes the subscription of someone no longer a contact when only managed criteria remain', async () => {
    http.get.mockResolvedValueOnce({
      data: {
        results: [
          {
            subscriberId: 's2',
            subscriber: { channels: [{ channel: 'email', address: 'gone@x.ca' }] },
            criteria: managed({ clientId: 'c1' }),
          },
        ],
      },
    });
    http.delete.mockResolvedValue({});

    await sync.sync(tenantId, { realm: 'r', admins: [], clients: [] }, 'token');

    expect(http.delete).toHaveBeenCalledWith(
      'https://notification.test/v1/types/client-secret-rotation/subscriptions/s2',
      expect.anything(),
    );
  });

  it('continues with other recipients when one fails', async () => {
    http.get.mockResolvedValueOnce({ data: { results: [] } }).mockRejectedValueOnce(new Error('boom'));
    http.get.mockResolvedValueOnce({ data: { results: [] } });

    await sync.sync(
      tenantId,
      { realm: 'r', admins: [], clients: [{ clientId: 'c1', contacts: ['a@x.ca', 'b@x.ca'] }] },
      'token',
    );

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(http.post).toHaveBeenCalledWith(
      expect.stringContaining('/subscriptions/'),
      expect.anything(),
      expect.anything(),
    );
  });
});
