import { DirectoryRepository } from '../../../directory/repository';
import { getNamespaceEntries, getServiceUrlById } from './getNamespaceEntries';
import { adspId } from '@abgov/adsp-service-sdk';

describe('directory', () => {
  const repositoryMock = {
    getDirectories: jest.fn(),
  };

  describe('getNamespaceEntries', () => {
    it('can get namespace', async () => {
      const directory = {
        services: [{ namespace: 'test-namespace', service: 'test-service', host: '/test/service' }],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(directory);
      const repository = repositoryMock as unknown as DirectoryRepository;

      const results = await getNamespaceEntries(repository, directory.services[0].namespace);
      expect(results).toEqual(
        expect.arrayContaining([
          {
            namespace: directory.services[0].namespace,
            service: directory.services[0].service,
            url: directory.services[0].host,
            urn: 'urn:ads:test-namespace:test-service',
          },
        ])
      );
    });

    it('can return empty for missing namespace', async () => {
      repositoryMock.getDirectories.mockResolvedValueOnce(null);
      const repository = repositoryMock as unknown as DirectoryRepository;

      const results = await getNamespaceEntries(repository, 'test-namespace');
      expect(results).toEqual(expect.arrayContaining([]));
    });

    it('throws err', async () => {
      repositoryMock.getDirectories.mockRejectedValueOnce(new Error('oh noes!'));
      const repository = repositoryMock as unknown as DirectoryRepository;

      expect(() => {
        expect(getNamespaceEntries(repository, 'test-namespace')).toThrowError(Error);
      });
    });
  });
});
describe('getServiceUrlByName', () => {
  const repositoryMock = {
    getDirectories: jest.fn(),
  };
  it('can return right service url for platform service', async () => {
    const directory = {
      services: [{ namespace: 'platform', service: 'test-service', host: 'https://chat.adsp-dev.gov.ab.ca/api/' }],
    };
    repositoryMock.getDirectories.mockResolvedValueOnce(directory);
    const repository = repositoryMock as unknown as DirectoryRepository;
    const tenantId = adspId`urn:ads:platform:test-service`;

    const results = await getServiceUrlById(tenantId, repository);
    expect(results.href).toEqual(directory.services[0].host);
  });

  it('can get error if service not found', async () => {
    const directory = {
      services: [{ namespace: 'platform', service: 'test-service', host: 'https://chat.adsp-dev.gov.ab.ca/api/' }],
    };
    repositoryMock.getDirectories.mockResolvedValueOnce(directory);
    const repository = repositoryMock as unknown as DirectoryRepository;
    const tenantId = adspId`urn:ads:platform:file-service`;
    const result = await getServiceUrlById(tenantId, repository);
    expect(result).toEqual(null);
  });
});
