import { adspId, User } from '@abgov/adsp-service-sdk';
import { TenantServiceRoles } from '@tenant-management-api/roles';
import { It, Mock } from 'moq.ts';
import { ServiceConfigurationRepository } from '../repository';
import { ServiceOption } from '../types';
import { ServiceOptionEntity } from './serviceOption';

describe('ServiceOptionEntity', () => {
  const options: Partial<ServiceOption> = {
    service: '',
    id: '',
    version: '',
    displayName: '',
    description: '',
  };

  const user: User = {
    id: '',
    email: '',
    name: '',
    roles: [TenantServiceRoles.PlatformService],
    tenantId: adspId`urn:ads:foobar`,
    token: {
      aud: '',
      azp: '',
      bearer: '',
      iss: '',
    },
    isCore: true,
  };

  it('creates a service option', async () => {
    const repoMock = new Mock<ServiceConfigurationRepository>();
    const repo = repoMock.object();
    const entity = new ServiceOptionEntity(repo, options);
    repoMock.setup((inst) => inst.save(It.IsAny())).returns(Promise.resolve(entity));

    const obj = await ServiceOptionEntity.create(user, repo, entity);
    expect(obj).toMatchObject(entity);
  });
});
