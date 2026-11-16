import { adspId } from '@abgov/adsp-service-sdk';
import { randomBytes } from 'crypto';
import { parseEncryptionKey } from './crypto';
import { StoredCredential } from './repository';
import { CredentialStore } from './store';

describe('CredentialStore', () => {
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/a`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/b`;
  const key = parseEncryptionKey(randomBytes(32).toString('base64'), 1);
  let records: Map<string, StoredCredential>;
  let store: CredentialStore;

  beforeEach(() => {
    records = new Map();
    store = new CredentialStore(
      {
        get: async (tenantId, connectionId) => records.get(`${tenantId}|${connectionId}`) ?? null,
        save: async (credential) => {
          records.set(`${credential.tenantId}|${credential.connectionId}`, credential);
          return credential;
        },
        delete: async (tenantId, connectionId) => records.delete(`${tenantId}|${connectionId}`),
      },
      key,
    );
  });

  it('stores an encrypted secret and reports status without it', async () => {
    const status = await store.set(tenantA, 'hr-site', 's3cret');
    expect(status).toEqual({ isSet: true, updatedAt: expect.any(Date) });
    expect(JSON.stringify([...records.values()])).not.toContain('s3cret');
    expect(await store.status(tenantA, 'hr-site')).toEqual({ isSet: true, updatedAt: expect.any(Date) });
    expect(await store.getSecret(tenantA, 'hr-site')).toBe('s3cret');
  });

  it('reports not set and returns null when there is no record', async () => {
    expect(await store.status(tenantA, 'missing')).toEqual({ isSet: false });
    expect(await store.getSecret(tenantA, 'missing')).toBeNull();
  });

  it('refuses a record moved to another tenant', async () => {
    await store.set(tenantA, 'hr-site', 's3cret');
    const record = records.get(`${tenantA}|hr-site`);
    records.set(`${tenantB}|hr-site`, { ...record, tenantId: tenantB.toString() });
    await expect(store.getSecret(tenantB, 'hr-site')).rejects.toThrow();
  });

  it('removes a credential', async () => {
    await store.set(tenantA, 'hr-site', 's3cret');
    expect(await store.remove(tenantA, 'hr-site')).toBe(true);
    expect(await store.status(tenantA, 'hr-site')).toEqual({ isSet: false });
  });
});
