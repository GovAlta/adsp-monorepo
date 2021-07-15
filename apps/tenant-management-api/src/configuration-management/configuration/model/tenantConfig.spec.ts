import { adspId, User } from '@abgov/adsp-service-sdk';
import { TenantServiceRoles } from '@tenant-management-api/roles';
import { It, Mock } from 'moq.ts';
import { TenantConfigurationRepository } from '../repository';
import { TenantConfig } from '../types';
import { TenantConfigEntity } from './tenantConfig';

describe('TenantConfigModel', () => {
  const config: TenantConfig = {
    id: '',
    tenantName: '',
    configurationSettingsList: {},
  };

  const user: User = {
    id: '',
    email: '',
    name: '',
    roles: [TenantServiceRoles.TenantAdmin],
    tenantId: adspId`urn:ads:foobar`,
    token: {
      aud: '',
      azp: '',
      bearer: '',
      iss: '',
    },
    isCore: true,
  };

  it('creates a tenant config', async () => {
    const mockRepo = new Mock<TenantConfigurationRepository>();
    const repo = mockRepo.object();
    const entity = new TenantConfigEntity(repo, config);

    mockRepo.setup((inst) => inst.save(It.IsAny())).returns(Promise.resolve(entity));

    const obj = await TenantConfigEntity.create(user, repo, config);
    expect(obj).toMatchObject(entity);
  });
});
