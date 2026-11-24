import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { TenantCriteria } from '../tenant/types';
import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
import { connection } from 'mongoose';
import { Logger } from 'winston';
import { TenantEntity } from '../tenant';
import { MongoTenantRepository } from './tenant';

describe('Mongo: Tenant', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  const repo = new MongoTenantRepository(logger);

  beforeEach(async () => {
    await connect();
  });

  afterEach(async () => {
    await disconnect();
  });

  it('should create a tenant', async () => {
    const data = await createMockData<TenantEntity>(repo, [
      {
        adminEmail: 'ae',
        realm: 'r',
        name: 'n',
      },
    ]);
    const results = await repo.find();
    expect(results.length).toEqual(data.length);
  });

  it('should throw NotFoundError with the lookup id when tenant does not exist', async () => {
    const missingId = '507f1f77bcf86cd799439011';
    await expect(repo.get(missingId)).rejects.toThrow(NotFoundError);
    await expect(repo.get(missingId)).rejects.toThrow(missingId);
  });

  describe('with an id that is not an ObjectId', () => {
    it('throws NotFoundError on get', async () => {
      await expect(repo.get('abc')).rejects.toThrow(NotFoundError);
      await expect(repo.get('abc')).rejects.toThrow('abc');
    });

    it('deletes nothing', async () => {
      await expect(repo.delete('abc')).resolves.toBe(false);
    });

    it('finds nothing by id', async () => {
      await expect(repo.find({ idEquals: 'abc' })).resolves.toEqual([]);
    });
  });

  describe('find with a non-string criterion', () => {
    it.each(['adminEmailEquals', 'nameEquals', 'realmEquals'])(
      'rejects an operator object for %s instead of querying with it',
      async (criterion) => {
        await expect(repo.find({ [criterion]: { $ne: null } } as unknown as TenantCriteria)).rejects.toThrow(
          InvalidOperationError,
        );
      },
    );
  });

  describe('find by name', () => {
    // Tenants have unique names, so the tenants of a test are removed after it.
    let created: TenantEntity[] = [];

    const createTenants = async (...names: string[]) => {
      created = await createMockData<TenantEntity>(
        repo,
        names.map((name, index) => ({ adminEmail: `admin${index}@example.ca`, realm: `realm-${index}`, name })),
      );
      return created;
    };

    afterEach(async () => {
      for (const tenant of created) {
        await repo.delete(tenant.id);
      }
      created = [];
    });

    it('can find a tenant by name, ignoring case', async () => {
      await createTenants('My Tenant', 'Other Tenant');

      const results = await repo.find({ nameEquals: 'my tenant' });

      expect(results.map((result) => result.name)).toEqual(['My Tenant']);
    });

    it('can find only a tenant with the whole name', async () => {
      await createTenants('My Tenant', 'My Tenant Two', 'The My Tenant');

      const results = await repo.find({ nameEquals: 'My Tenant' });

      expect(results.map((result) => result.name)).toEqual(['My Tenant']);
    });

    it.each(['.*', '.+', '^', '$', 'My.*', '.*Tenant', '[A-Z]+ [A-Z]+', '(My|Other) Tenant', 'My Tenan.'])(
      'does not treat %s as a pattern',
      async (name) => {
        await createTenants('My Tenant', 'Other Tenant');

        expect(await repo.find({ nameEquals: name })).toEqual([]);
      },
    );

    // New tenants cannot have these characters in their name, but a name is still matched literally.
    it.each(['Ministry of Health (Test)', 'Test-Tenant', 'A+B', 'What?', 'Cost $5', 'Dev [UAT]', 'a.b'])(
      'can find a tenant with the name %s',
      async (name) => {
        await createTenants(name, 'Other Tenant');

        const results = await repo.find({ nameEquals: name });

        expect(results.map((result) => result.name)).toEqual([name]);
      },
    );

    it('does not find a tenant for a name that differs by a character that a pattern could match', async () => {
      await createTenants('a.b', 'axb');

      const results = await repo.find({ nameEquals: 'a.b' });

      expect(results.map((result) => result.name)).toEqual(['a.b']);
    });

    it('can find a tenant by name together with other criteria', async () => {
      await createTenants('My Tenant');

      expect(await repo.find({ nameEquals: 'my tenant', realmEquals: 'realm-0' })).toHaveLength(1);
      expect(await repo.find({ nameEquals: 'my tenant', realmEquals: 'other' })).toHaveLength(0);
    });
  });

  describe('find by status', () => {
    let created: TenantEntity[] = [];

    beforeEach(async () => {
      created = await createMockData<TenantEntity>(repo, [
        { adminEmail: 'a@example.ca', realm: 'realm-a', name: 'Active', status: 'active' },
        { adminEmail: 'p@example.ca', realm: 'realm-p', name: 'Provisioning', status: 'provisioning' },
        {
          adminEmail: 'r@example.ca',
          realm: 'realm-r',
          name: 'Archived',
          status: 'archived',
          deletedAt: new Date('2026-01-01'),
        },
        {
          adminEmail: 'n@example.ca',
          realm: 'realm-n',
          name: 'Newly archived',
          status: 'archived',
          deletedAt: new Date(),
        },
      ]);
    });

    afterEach(async () => {
      for (const tenant of created) {
        await repo.delete(tenant.id);
      }
      created = [];
    });

    // Other tests leave tenants behind, so only the tenants of this block are compared.
    const names = (results: TenantEntity[]) =>
      results
        .filter((result) => created.some((tenant) => tenant.id === result.id))
        .map((result) => result.name)
        .sort();

    it('can find only active tenants', async () => {
      expect(names(await repo.find({ activeOnly: true }))).toEqual(['Active']);
    });

    it('can exclude archived tenants', async () => {
      expect(names(await repo.find({ excludeArchived: true }))).toEqual(['Active', 'Provisioning']);
    });

    it('can find archived tenants', async () => {
      expect(names(await repo.find({ statusEquals: 'archived' }))).toEqual(['Archived', 'Newly archived']);
    });

    it('can find tenants with status active', async () => {
      expect(names(await repo.find({ statusEquals: 'active' }))).toEqual(['Active']);
    });

    it('can find a legacy tenant with no stored status as active', async () => {
      const { insertedId } = await connection.collection('tenants').insertOne({
        name: 'Legacy',
        realm: 'realm-l',
        adminEmail: 'l@example.ca',
      });

      const results = await repo.find({ statusEquals: 'active' });
      await repo.delete(`${insertedId}`);

      expect(results.map((result) => result.name)).toContain('Legacy');
    });

    it('can find archived tenants deleted before a date', async () => {
      const results = await repo.find({ statusEquals: 'archived', deletedBefore: new Date('2026-06-01') });
      expect(names(results)).toEqual(['Archived']);
    });

    it('can save archive and restore of a tenant', async () => {
      const [tenant] = await repo.find({ nameEquals: 'Active' });

      tenant.archive();
      const archived = await tenant.save();
      expect(archived.status).toBe('archived');
      expect(archived.deletedAt).toBeInstanceOf(Date);

      archived.restore();
      const restored = await archived.save();
      expect(restored.status).toBe('active');
      expect(restored.deletedAt).toBeFalsy();
    });
  });
});
