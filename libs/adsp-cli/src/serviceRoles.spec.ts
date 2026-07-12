jest.mock('./directory', () => ({
  getServiceUrls: jest.fn(),
}));
jest.mock('./configuration', () => ({
  getConfiguration: jest.fn(),
}));

import { getConfiguration } from './configuration';
import { getServiceUrls } from './directory';
import { getServiceRoles, ServiceNotInDirectoryError } from './serviceRoles';

const mockGetServiceUrls = getServiceUrls as jest.Mock;
const mockGetConfiguration = getConfiguration as jest.Mock;

afterEach(() => {
  jest.resetAllMocks();
});

describe('getServiceRoles', () => {
  it('flattens the tenant-service configuration into a role list', async () => {
    mockGetServiceUrls.mockResolvedValue({
      'urn:ads:platform:configuration-service:v2': 'https://configuration-service.example.com',
    });
    mockGetConfiguration.mockResolvedValue({
      'urn:ads:platform:event-service': {
        roles: [{ role: 'event-sender', description: 'Sender role for event service.' }],
      },
      'urn:ads:platform:task-service': {
        roles: [
          { role: 'task-admin', description: 'Administrator role for tasks.', inTenantAdmin: true },
          { role: 'task-reader', description: 'Reader role for tasks.' },
        ],
      },
    });

    const roles = await getServiceRoles('token-abc', 'https://directory-service.example.com');

    expect(roles).toEqual([
      {
        serviceId: 'urn:ads:platform:event-service',
        serviceName: 'event-service',
        role: 'event-sender',
        description: 'Sender role for event service.',
        inTenantAdmin: undefined,
      },
      {
        serviceId: 'urn:ads:platform:task-service',
        serviceName: 'task-service',
        role: 'task-admin',
        description: 'Administrator role for tasks.',
        inTenantAdmin: true,
      },
      {
        serviceId: 'urn:ads:platform:task-service',
        serviceName: 'task-service',
        role: 'task-reader',
        description: 'Reader role for tasks.',
        inTenantAdmin: undefined,
      },
    ]);
    expect(mockGetConfiguration).toHaveBeenCalledWith(
      'token-abc',
      'https://configuration-service.example.com',
      'platform',
      'tenant-service'
    );
  });

  it('throws ServiceNotInDirectoryError when configuration-service is not in the directory', async () => {
    mockGetServiceUrls.mockResolvedValue({});

    await expect(getServiceRoles('token-abc', 'https://directory-service.example.com')).rejects.toBeInstanceOf(
      ServiceNotInDirectoryError
    );
    expect(mockGetConfiguration).not.toHaveBeenCalled();
  });

  it('handles services with no roles field', async () => {
    mockGetServiceUrls.mockResolvedValue({
      'urn:ads:platform:configuration-service:v2': 'https://configuration-service.example.com',
    });
    mockGetConfiguration.mockResolvedValue({
      'urn:ads:platform:directory-service': {},
    });

    const roles = await getServiceRoles('token-abc', 'https://directory-service.example.com');

    expect(roles).toEqual([]);
  });
});
