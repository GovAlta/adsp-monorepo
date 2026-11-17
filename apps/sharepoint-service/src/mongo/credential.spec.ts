import { adspId } from '@abgov/adsp-service-sdk';
import { connect, disconnect } from 'mongoose';
import { MongoCredentialRepository } from './credential';

describe('MongoCredentialRepository', () => {
  const tenantA = adspId`urn:ads:platform:tenant-service:v2:/tenants/a`;
  const tenantB = adspId`urn:ads:platform:tenant-service:v2:/tenants/b`;
  let repository: MongoCredentialRepository;

  const record = (tenantId: string, ciphertext = 'c1') => ({
    tenantId,
    connectionId: 'hr-site',
    ciphertext,
    iv: 'iv',
    authTag: 'tag',
    keyVersion: 1,
    updatedAt: new Date(),
  });

  beforeAll(async () => {
    await connect(process.env.MONGO_URL);
    repository = new MongoCredentialRepository();
  });

  afterAll(async () => {
    await disconnect();
  });

  it('upserts by tenant and connection', async () => {
    await repository.save(record(tenantA.toString(), 'c1'));
    await repository.save(record(tenantA.toString(), 'c2'));
    expect(await repository.get(tenantA, 'hr-site')).toEqual(expect.objectContaining({ ciphertext: 'c2' }));
  });

  it('keeps tenants separate', async () => {
    expect(await repository.get(tenantB, 'hr-site')).toBeNull();
  });

  it('deletes', async () => {
    expect(await repository.delete(tenantA, 'hr-site')).toBe(true);
    expect(await repository.get(tenantA, 'hr-site')).toBeNull();
    expect(await repository.delete(tenantA, 'hr-site')).toBe(false);
  });

  it('finds records not on a key version', async () => {
    await repository.save(record(tenantA.toString(), 'old'));
    await repository.save({ ...record(tenantB.toString(), 'new'), keyVersion: 2 });

    const outdated = await repository.findNotOnKeyVersion(2);

    expect(outdated.map(({ tenantId, ciphertext }) => ({ tenantId, ciphertext }))).toEqual([
      { tenantId: tenantA.toString(), ciphertext: 'old' },
    ]);
  });

  it('replaces the encrypted secret only when the record is unchanged, keeping its updated date', async () => {
    const original = { ...record(tenantA.toString(), 'before'), updatedAt: new Date('2026-01-02T03:04:05Z') };
    await repository.save(original);
    const next = { ciphertext: 'after', iv: 'iv2', authTag: 'tag2', keyVersion: 2 };

    expect(await repository.replaceIfUnchanged(original, next)).toBe(true);
    expect(await repository.get(tenantA, 'hr-site')).toEqual(
      expect.objectContaining({ ...next, updatedAt: original.updatedAt }),
    );

    expect(await repository.replaceIfUnchanged(original, { ...next, ciphertext: 'again' })).toBe(false);
    expect(await repository.get(tenantA, 'hr-site')).toEqual(expect.objectContaining({ ciphertext: 'after' }));
  });
});
