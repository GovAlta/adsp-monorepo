import { adspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { WebhookRepo } from './WebhookRepo';

describe('WebhookRepo', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('Toot!')),
  };

  const configurationServiceMock = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
  };

  const webhook = {
    id: 'hook-1',
    url: 'http://localhost/hook',
    name: 'Test hook',
    targetId: 'test-app',
    intervalMinutes: 1,
    eventTypes: [{ id: 'status-service:monitored-service-down' }],
    description: 'A test hook',
    appCurrentlyUp: true,
  };

  const repo = new WebhookRepo(tokenProviderMock, configurationServiceMock as unknown as ConfigurationService);

  describe('getWebhooks', () => {
    it('returns no webhooks when the push service configuration has none', async () => {
      configurationServiceMock.getConfiguration.mockResolvedValueOnce({});

      await expect(repo.getWebhooks(tenantId)).resolves.toEqual({});
    });

    it('returns undefined from getWebhook when no webhooks are configured', async () => {
      configurationServiceMock.getConfiguration.mockResolvedValueOnce(null);

      await expect(repo.getWebhook('hook-1', tenantId)).resolves.toBeUndefined();
    });

    it('returns push service webhooks with the tenant id applied', async () => {
      configurationServiceMock.getConfiguration.mockResolvedValueOnce({ webhooks: { 'hook-1': webhook } });

      const webhooks = await repo.getWebhooks(tenantId);

      expect(webhooks).toEqual({ 'hook-1': { ...webhook, tenantId } });
      expect(configurationServiceMock.getConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({ service: 'push-service' }),
        'Toot!',
        tenantId,
      );
    });
  });

  describe('getWebhook', () => {
    it('returns the webhook matching the id', async () => {
      configurationServiceMock.getConfiguration.mockResolvedValueOnce({ webhooks: { 'hook-1': webhook } });

      const result = await repo.getWebhook('hook-1', tenantId);

      expect(result).toEqual({ ...webhook, tenantId });
    });

    it('returns undefined when no webhook matches the id', async () => {
      configurationServiceMock.getConfiguration.mockResolvedValueOnce({ webhooks: { 'hook-1': webhook } });

      const result = await repo.getWebhook('not-a-hook', tenantId);

      expect(result).toBeUndefined();
    });
  });
});
