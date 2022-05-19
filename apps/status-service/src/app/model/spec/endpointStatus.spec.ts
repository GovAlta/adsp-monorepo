import { EndpointStatusEntryEntity } from '../endpointStatusEntry';
import type { User } from '@abgov/adsp-service-sdk';

describe('EndpointStatusEntryEntity', () => {
  const repositoryMock = {
    findRecentByUrl: jest.fn(),
    deleteOldUrlStatus: jest.fn(),
    delete: jest.fn(),
    save: jest.fn(),
    get: jest.fn(),
  };

  const endpointStatusEntityMock = {
    ok: true,
    url: 'https://mock-test.com',
    timestamp: 1652124960014,
    responseTime: 179,
    status: '200',
  };
  const userMock = {} as User;

  it('Can create the endpoint status entity', () => {
    const endpointEntity = new EndpointStatusEntryEntity(repositoryMock, endpointStatusEntityMock);
    expect(endpointEntity).toBeTruthy();

    EndpointStatusEntryEntity.create(repositoryMock, endpointStatusEntityMock);
    expect(repositoryMock.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: endpointStatusEntityMock.url,
      })
    );
  });

  it('Can delete the endpoint status entity', async () => {
    const endpointEntity = new EndpointStatusEntryEntity(repositoryMock, endpointStatusEntityMock);
    await endpointEntity.delete(userMock);
    expect(repositoryMock.delete).toHaveBeenLastCalledWith(
      expect.objectContaining({
        url: endpointStatusEntityMock.url,
      })
    );
  });
});
