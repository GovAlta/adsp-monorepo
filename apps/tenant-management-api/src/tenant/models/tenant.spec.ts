import { TenantEntity } from './tenant';
import { v4 as uuidv4 } from 'uuid';
import { TenantRepository } from '../repository';
import { It, Mock } from 'moq.ts';

describe('TenantEntity', () => {
  it('can be constructed', () => {
    const id = uuidv4();
    const repositoryMock = new Mock<TenantRepository>();
    const tenant = {
      id,
      name: 'mock-realm',
      realm: 'mock',
      adminEmail: 'mock@gov.ab.ca',
    };
    const entity = new TenantEntity(repositoryMock.object(), tenant);
    expect(entity).toMatchObject(tenant);
  });

  it('returns a tenant object', () => {
    const repositoryMock = new Mock<TenantRepository>();
    const id = uuidv4();
    const entity = new TenantEntity(repositoryMock.object(), {
      id,
      name: 'mock-realm',
      realm: 'mock',
      adminEmail: 'mock@gov.ab.ca',
    });

    expect(entity.id).toBe(id);
  });

  it('can create new tenant', async () => {
    const repositoryMock = new Mock<TenantRepository>();
    const tenant = {
      name: 'mock-realm',
      realm: 'mock',
      adminEmail: 'mock@gov.ab.ca',
    };

    repositoryMock.setup((instance) => instance.save(It.IsAny())).callback((i) => Promise.resolve(i.args[0]));

    const entity = await TenantEntity.create(repositoryMock.object(), tenant.name, tenant.realm, tenant.adminEmail);

    expect(entity).toMatchObject(tenant);
    repositoryMock.verify((instance) => instance.save(entity));
  });

  describe('save', () => {
    it('can save the tenant', () => {
      const repositoryMock = new Mock<TenantRepository>();
      const id = uuidv4();
      const entity = new TenantEntity(repositoryMock.object(), {
        id,
        name: 'mock-realm',
        realm: 'mock',
        adminEmail: 'mock@gov.ab.ca',
      });

      repositoryMock.setup((instance) => instance.save(It.IsAny())).returns(Promise.resolve(entity));
      entity.save();
      repositoryMock.verify((instance) => instance.save(entity));
    });
  });

  describe('delete', () => {
    it('can delete tenant', async () => {
      const repositoryMock = new Mock<TenantRepository>();
      const id = uuidv4();
      const entity = new TenantEntity(repositoryMock.object(), {
        id,
        name: 'mock-realm',
        realm: 'mock',
        adminEmail: 'mock@gov.ab.ca',
      });

      repositoryMock.setup((instance) => instance.delete(id)).returns(Promise.resolve(true));

      const result = entity.delete();

      expect(result).toBeTruthy();
      repositoryMock.verify((instance) => instance.delete(id));
    });
  });
});
