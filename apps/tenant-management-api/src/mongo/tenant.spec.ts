import { NotFoundError } from '@core-services/core-common';
import { connect, disconnect, createMockData } from '@core-services/core-common/mongo';
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

  describe('find by name', () => {
    // Tenants have unique names, so the tenants of a test are removed after it.
    let created: TenantEntity[] = [];

    const createTenants = async (...names: string[]) => {
      created = await createMockData<TenantEntity>(
        repo,
        names.map((name, index) => ({ adminEmail: `admin${index}@example.ca`, realm: `realm-${index}`, name }))
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
      }
    );

    // New tenants cannot have these characters in their name, but a name is still matched literally.
    it.each(['Ministry of Health (Test)', 'Test-Tenant', 'A+B', 'What?', 'Cost $5', 'Dev [UAT]', 'a.b'])(
      'can find a tenant with the name %s',
      async (name) => {
        await createTenants(name, 'Other Tenant');

        const results = await repo.find({ nameEquals: name });

        expect(results.map((result) => result.name)).toEqual([name]);
      }
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
});
