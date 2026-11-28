import { adspId } from '@abgov/adsp-service-sdk';
import { ATTRIBUTES, resolveConfiguration } from '@core-services/client-secret-rotation';
import type { Logger } from 'winston';
import { createClientSecretNotifyJob, scheduleClientSecretNotifyJob } from './notify';

describe('client secret rotation notify job', () => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as unknown as Logger;
  const now = new Date('2026-11-26T15:00:00.000Z');
  const DAY = 24 * 60 * 60 * 1000;
  const tenant = { id: 'abc', realm: 'tenant-a' };

  const keycloak = {
    isPolicyEnabled: jest.fn(),
    listClients: jest.fn(),
    setAttributes: jest.fn(),
  };
  const tenantRepository = { find: jest.fn() };
  const settingsStore = { get: jest.fn() };
  const eventService = { send: jest.fn() };
  const createKeycloak = jest.fn();

  const client = (clientId: string, state = {}, optedIn = true) => ({
    id: `id-${clientId}`,
    clientId,
    contacts: [],
    optedIn,
    state,
  });

  const run = () =>
    createClientSecretNotifyJob({
      logger,
      tenantRepository,
      createKeycloak,
      settingsStore,
      eventService,
      getConfiguration: async () => resolveConfiguration(undefined),
      links: { runbookUrl: 'https://runbook.test', keycloakUrl: 'https://kc.test/auth' },
      now: () => now,
    });

  beforeEach(() => {
    jest.resetAllMocks();
    createKeycloak.mockResolvedValue(keycloak);
    tenantRepository.find.mockResolvedValue([tenant]);
    keycloak.isPolicyEnabled.mockResolvedValue(true);
    keycloak.listClients.mockResolvedValue([]);
    settingsStore.get.mockResolvedValue(undefined);
  });

  it('sends a per-client due notice and a realm digest, then records the marker', async () => {
    const expiry = new Date(now.getTime() + 30 * DAY);
    keycloak.listClients.mockResolvedValue([client('app-1', { expiry })]);

    await run()();

    const [due, digest] = eventService.send.mock.calls.map(([event]) => event);
    expect(due).toMatchObject({
      name: 'client-secret-rotation-due',
      context: { clientId: 'app-1' },
      payload: { realm: 'tenant-a', clientId: 'app-1', daysRemaining: 30, runbookUrl: 'https://runbook.test' },
    });
    expect(due.context).not.toHaveProperty('realm');
    expect(due.tenantId.toString()).toBe(adspId`urn:ads:platform:tenant-service:v2:/tenants/abc`.toString());
    expect(digest).toMatchObject({ name: 'client-secret-rotation-digest', context: { realm: 'tenant-a' } });
    expect(digest.context).not.toHaveProperty('clientId');
    expect(digest.payload.due).toHaveLength(1);
    expect(digest.payload.due[0].keycloakUrl).toBe(
      'https://kc.test/auth/admin/tenant-a/console/#/tenant-a/clients/id-app-1/credentials',
    );
    expect(keycloak.setAttributes).toHaveBeenCalledWith('tenant-a', 'id-app-1', {
      [ATTRIBUTES.noticeSentFor]: expiry.toISOString(),
      [ATTRIBUTES.noticeSentAt]: now.toISOString(),
    });
  });

  it('uses the realm notice period from settings', async () => {
    settingsStore.get.mockResolvedValue({ noticePeriod: 10 * 24 * 60 * 60 });
    keycloak.listClients.mockResolvedValue([client('app-1', { expiry: new Date(now.getTime() + 30 * DAY) })]);

    await run()();

    expect(eventService.send).not.toHaveBeenCalled();
  });

  it('sends a revoked notice once the previous secret stopped working', async () => {
    const lastRotated = new Date(now.getTime() - 10 * DAY);
    const rotatedExpiry = new Date(now.getTime() - 3 * DAY);
    keycloak.listClients.mockResolvedValue([
      client('app-1', { lastRotated, rotatedExpiry, expiry: new Date(now.getTime() + 80 * DAY) }),
    ]);

    await run()();

    expect(eventService.send.mock.calls[0][0]).toMatchObject({
      name: 'client-secret-revoked',
      context: { clientId: 'app-1' },
      payload: { revokedAt: rotatedExpiry.toISOString() },
    });
    expect(eventService.send.mock.calls[1][0].payload.revoked).toHaveLength(1);
    expect(keycloak.setAttributes).toHaveBeenCalledWith('tenant-a', 'id-app-1', {
      [ATTRIBUTES.revokedNoticeSentFor]: lastRotated.toISOString(),
    });
  });

  it('does not notify again when the marker is already set', async () => {
    const expiry = new Date(now.getTime() + 30 * DAY);
    keycloak.listClients.mockResolvedValue([
      client('app-1', { expiry, noticeSentFor: expiry, noticeSentAt: new Date(now.getTime() - DAY) }),
    ]);

    await run()();

    expect(eventService.send).not.toHaveBeenCalled();
  });

  it('skips clients that are not opted in, have no expiry yet, or are outside the notice window', async () => {
    keycloak.listClients.mockResolvedValue([
      client('not-opted-in', { expiry: new Date(now.getTime() + 5 * DAY) }, false),
      client('no-expiry'),
      client('far-away', { expiry: new Date(now.getTime() + 80 * DAY) }),
    ]);

    await run()();

    expect(eventService.send).not.toHaveBeenCalled();
    expect(keycloak.setAttributes).not.toHaveBeenCalled();
  });

  it('skips realms whose policy is off', async () => {
    keycloak.isPolicyEnabled.mockResolvedValue(false);

    await run()();

    expect(keycloak.listClients).not.toHaveBeenCalled();
  });

  it('continues with other realms when one fails', async () => {
    tenantRepository.find.mockResolvedValue([{ id: 'x', realm: 'bad' }, tenant]);
    keycloak.isPolicyEnabled.mockRejectedValueOnce(new Error('forbidden')).mockResolvedValue(true);
    keycloak.listClients.mockResolvedValue([client('app-1', { expiry: new Date(now.getTime() + 30 * DAY) })]);

    await run()();

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('bad'), expect.anything());
    expect(eventService.send).toHaveBeenCalledTimes(2);
  });

  it('leaves the marker unset when the digest fails so the next run retries', async () => {
    keycloak.listClients.mockResolvedValue([client('app-1', { expiry: new Date(now.getTime() + 30 * DAY) })]);
    eventService.send.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('down'));

    await run()();

    expect(keycloak.setAttributes).not.toHaveBeenCalled();
  });

  it('signs in separately for each realm', async () => {
    tenantRepository.find.mockResolvedValue([tenant, { ...tenant, realm: 'other-realm' }]);

    await run()();

    expect(createKeycloak.mock.calls).toEqual([[tenant.realm], ['other-realm']]);
  });

  it('skips a run while the previous one is still going', async () => {
    let release: () => void;
    createKeycloak.mockReturnValue(new Promise((resolve) => (release = () => resolve(keycloak))));
    const job = run();

    const first = job();
    await job();
    release();
    await first;

    expect(createKeycloak).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalled();
  });

  it('rejects an invalid cron', () => {
    expect(() =>
      scheduleClientSecretNotifyJob({
        logger,
        tenantRepository,
        createKeycloak,
        settingsStore,
        eventService,
        getConfiguration: async () => resolveConfiguration(undefined),
        cron: 'not a cron',
      }),
    ).toThrow('Invalid client secret rotation notify schedule');
  });
});
