import { adspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { GraphClient, GraphTokenProvider } from './graph';
import { SharePointPusher } from './push';
import { withRetryScope } from './retry';
import { SharePointConfiguration } from './types';
import { RunningSharePointMockServer, startSharePointMockServer } from '../mock-server/server';
import {
  DEMO_CLIENT_ID,
  DEMO_CLIENT_SECRET,
  DEMO_ENTRA_TENANT_ID,
  DEMO_LIST_ID,
  DEMO_SITE_ID,
} from '../mock-server/seed';

describe('retries against the SharePoint mock server', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/a`;
  const configuration: SharePointConfiguration = {
    connections: {
      'hr-site': {
        id: 'hr-site',
        name: 'HR',
        entraTenantId: DEMO_ENTRA_TENANT_ID,
        clientId: DEMO_CLIENT_ID,
        siteId: DEMO_SITE_ID,
      },
    },
    destinations: {
      'hr-intake': {
        id: 'hr-intake',
        name: 'Intake',
        connectionId: 'hr-site',
        listId: DEMO_LIST_ID,
        fieldMappings: [{ source: 'firstName', target: 'FirstName' }],
        idempotencyFields: ['_adsp.key'],
      },
    },
  };

  let server: RunningSharePointMockServer;
  let pusher: SharePointPusher;
  const logger = { warn: jest.fn() } as unknown as Logger;

  beforeEach(async () => {
    server = await startSharePointMockServer();
    const tokens = new GraphTokenProvider(server.url, { getSecret: async () => DEMO_CLIENT_SECRET });
    pusher = new SharePointPusher(tokens, new GraphClient(`${server.url}/v1.0`));
    (logger.warn as jest.Mock).mockReset();
  });

  afterEach(() => server.close());

  const push = (key: string) =>
    withRetryScope(logger, { context: 'test' }, () =>
      pusher.push(tenantId, configuration, 'hr-intake', { firstName: 'Ada', _adsp: { key } }),
    );

  it('waits for the Retry-After sent by a throttled response, then writes the row', async () => {
    server.state.setFault('throttle', 1);
    const start = Date.now();

    expect(await push('k1')).toEqual({ itemId: '1', outcome: 'created' });

    expect(Date.now() - start).toBeGreaterThanOrEqual(1900);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'Retrying SharePoint request (retry 1 of 3) after: graph:TooManyRequests.',
      expect.anything(),
    );
  }, 15000);

  it('retries a service unavailable response and adds exactly one row', async () => {
    server.state.setFault('unavailable', 1);

    expect(await push('k2')).toEqual({ itemId: '1', outcome: 'created' });

    expect(server.state.listItems(DEMO_LIST_ID)).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalledWith(
      'Retrying SharePoint request (retry 1 of 3) after: graph:serviceNotAvailable.',
      expect.anything(),
    );
  }, 15000);
});
