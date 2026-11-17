import { adspId } from '@abgov/adsp-service-sdk';
import { randomBytes } from 'crypto';
import { CredentialUnreadableError } from '../errors';
import { EncryptionKeyring, parseEncryptionKey } from './crypto';
import { CredentialRepository, StoredCredential } from './repository';
import { CredentialStore } from './store';

const newKey = (version: number) => parseEncryptionKey(randomBytes(32).toString('base64'), version);

class MemoryCredentialRepository implements CredentialRepository {
  records = new Map<string, StoredCredential>();

  private id(tenantId: unknown, connectionId: string) {
    return `${tenantId}|${connectionId}`;
  }

  async get(tenantId, connectionId: string) {
    return this.records.get(this.id(tenantId, connectionId)) ?? null;
  }

  async save(credential: StoredCredential) {
    this.records.set(this.id(credential.tenantId, credential.connectionId), credential);
    return credential;
  }

  async delete(tenantId, connectionId: string) {
    return this.records.delete(this.id(tenantId, connectionId));
  }

  async findNotOnKeyVersion(version: number) {
    return [...this.records.values()].filter((record) => record.keyVersion !== version);
  }

  async replaceIfUnchanged(previous: StoredCredential, next) {
    const id = this.id(previous.tenantId, previous.connectionId);
    const stored = this.records.get(id);
    if (stored?.keyVersion !== previous.keyVersion || stored?.ciphertext !== previous.ciphertext) {
      return false;
    }
    this.records.set(id, { ...stored, ...next });
    return true;
  }
}

describe('CredentialStore', () => {
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/a`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/b`;
  const key1 = newKey(1);
  let repository: MemoryCredentialRepository;
  let store: CredentialStore;

  const storeWith = (keys: EncryptionKeyring) => new CredentialStore(repository, keys);

  beforeEach(() => {
    repository = new MemoryCredentialRepository();
    store = storeWith({ current: key1 });
  });

  it('stores an encrypted secret and reports status without it', async () => {
    const status = await store.set(tenantA, 'hr-site', 's3cret');
    expect(status).toEqual({ isSet: true, updatedAt: expect.any(Date) });
    expect(JSON.stringify([...repository.records.values()])).not.toContain('s3cret');
    expect(await store.status(tenantA, 'hr-site')).toEqual({ isSet: true, updatedAt: expect.any(Date) });
    expect(await store.getSecret(tenantA, 'hr-site')).toBe('s3cret');
  });

  it('reports not set and returns null when there is no record', async () => {
    expect(await store.status(tenantA, 'missing')).toEqual({ isSet: false });
    expect(await store.getSecret(tenantA, 'missing')).toBeNull();
  });

  it('refuses a record moved to another tenant', async () => {
    await store.set(tenantA, 'hr-site', 's3cret');
    const record = repository.records.get(`${tenantA}|hr-site`);
    repository.records.set(`${tenantB}|hr-site`, { ...record, tenantId: tenantB.toString() });
    await expect(store.getSecret(tenantB, 'hr-site')).rejects.toBeInstanceOf(CredentialUnreadableError);
  });

  it.each([
    ['a different key with the same version', { current: newKey(1) }],
    ['a new key version without the previous key', { current: newKey(2) }],
  ])('reports a secret it cannot decrypt after moving to %s', async (_change, keys) => {
    await store.set(tenantA, 'hr-site', 's3cret');
    await expect(storeWith(keys).getSecret(tenantA, 'hr-site')).rejects.toBeInstanceOf(CredentialUnreadableError);
  });

  it('removes a credential', async () => {
    await store.set(tenantA, 'hr-site', 's3cret');
    expect(await store.remove(tenantA, 'hr-site')).toBe(true);
    expect(await store.status(tenantA, 'hr-site')).toEqual({ isSet: false });
  });

  describe('after a key rotation', () => {
    const key2 = newKey(2);
    let rotated: CredentialStore;

    beforeEach(async () => {
      await store.set(tenantA, 'hr-site', 'secret-a');
      await store.set(tenantB, 'hr-site', 'secret-b');
      rotated = storeWith({ current: key2, previous: key1 });
    });

    it('still reads secrets saved with the previous key', async () => {
      expect(await rotated.getSecret(tenantA, 'hr-site')).toBe('secret-a');
    });

    it('saves new secrets with the current key', async () => {
      await rotated.set(tenantA, 'new-site', 'secret-new');
      expect(repository.records.get(`${tenantA}|new-site`).keyVersion).toBe(2);
    });

    it('re-encrypts every secret on the previous key, keeping its updated date', async () => {
      const updatedAt = repository.records.get(`${tenantA}|hr-site`).updatedAt;

      expect(await rotated.reencrypt()).toEqual({ checked: 2, converted: 2, changedDuringRun: 0, failed: 0 });

      expect([...repository.records.values()].map((record) => record.keyVersion)).toEqual([2, 2]);
      expect(repository.records.get(`${tenantA}|hr-site`).updatedAt).toBe(updatedAt);
      expect(await storeWith({ current: key2 }).getSecret(tenantA, 'hr-site')).toBe('secret-a');
      expect(await storeWith({ current: key2 }).getSecret(tenantB, 'hr-site')).toBe('secret-b');
    });

    it('does nothing when every secret is already on the current key', async () => {
      await rotated.reencrypt();
      expect(await rotated.reencrypt()).toEqual({ checked: 0, converted: 0, changedDuringRun: 0, failed: 0 });
    });

    it('never overwrites a secret saved again while the job runs', async () => {
      const replace = repository.replaceIfUnchanged.bind(repository);
      jest.spyOn(repository, 'replaceIfUnchanged').mockImplementationOnce(async (previous, next) => {
        await rotated.set(tenantA, 'hr-site', 'saved-during-run');
        return replace(previous, next);
      });

      const result = await rotated.reencrypt();

      expect(result.changedDuringRun).toBe(1);
      expect(result.converted).toBe(1);
      expect(await rotated.getSecret(tenantA, 'hr-site')).toBe('saved-during-run');
    });

    it('counts secrets on a version neither key matches as failed', async () => {
      const key3 = newKey(3);
      expect(await storeWith({ current: key3, previous: key2 }).reencrypt()).toEqual({
        checked: 2,
        converted: 0,
        changedDuringRun: 0,
        failed: 2,
      });
    });
  });
});
