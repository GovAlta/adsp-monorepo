import { adspId, User } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import axios from 'axios';
import { ApplicationRepo } from './ApplicationRepo';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('ApplicationRepo.deleteApp', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const user = { id: 'tester', tenantId } as User;
  const status = { delete: jest.fn().mockResolvedValue(true) };
  const statusRepository = { find: jest.fn() };
  const endpointRepository = { deleteAll: jest.fn().mockResolvedValue(true) };

  const createRepo = () => {
    const repo = new ApplicationRepo(
      statusRepository as never,
      endpointRepository as never,
      adspId`urn:ads:platform:status-service`,
      { getServiceUrl: jest.fn().mockResolvedValue(new URL('http://config')) } as never,
      { getAccessToken: jest.fn().mockResolvedValue('token') },
      {} as never,
    );
    repo.getApp = jest.fn().mockResolvedValue({ appKey: 'app', name: 'App', url: 'http://app' });
    return repo;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    statusRepository.find.mockResolvedValue([status]);
  });

  it('deletes the status, health entries and configuration', async () => {
    axiosMock.patch.mockResolvedValueOnce({});
    await createRepo().deleteApp('app', user);
    expect(status.delete).toHaveBeenCalled();
    expect(endpointRepository.deleteAll).toHaveBeenCalledWith('app', tenantId.toString());
    expect(axiosMock.patch).toHaveBeenCalledWith(
      expect.stringContaining('/configuration/v2/configuration/platform/status-service'),
      { operation: 'DELETE', property: 'app' },
      { headers: { Authorization: 'Bearer token' } },
    );
  });

  it('rejects when the configuration delete fails', async () => {
    const failure = new Error('configuration unavailable');
    axiosMock.patch.mockRejectedValueOnce(failure);
    await expect(createRepo().deleteApp('app', user)).rejects.toBe(failure);
  });

  it('throws NotFoundError for an unknown application', async () => {
    const repo = createRepo();
    repo.getApp = jest.fn().mockResolvedValue(undefined);
    await expect(repo.deleteApp('missing', user)).rejects.toBeInstanceOf(NotFoundError);
    expect(axiosMock.patch).not.toHaveBeenCalled();
  });
});
