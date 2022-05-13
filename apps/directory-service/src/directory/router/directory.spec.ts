import axios from 'axios';
import { DirectoryRepository } from '../../directory/repository';
import { getNamespaceEntries } from './util/getNamespaceEntries';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;
axiosMock.post.mockResolvedValueOnce({});

describe('directory', () => {
  const repositoryMock = {
    getDirectories: jest.fn(),
  };

  describe('getNamespaceEntries', () => {
    it('can get namespace', async () => {
      const directory = {
        services: [{ _id: '3', namespace: 'test-namespace', service: 'test-service', host: '/test/service' }],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(directory);
      const repository = repositoryMock as unknown as DirectoryRepository;

      const results = await getNamespaceEntries(repository, directory.services[0].namespace);
      expect(results).toEqual(
        expect.arrayContaining([
          {
            _id: directory.services[0]._id,
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
