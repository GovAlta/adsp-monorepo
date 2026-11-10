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
});
