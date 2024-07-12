import { adspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { CacheServiceConfiguration } from './configuration';
import { CacheProvider } from '../cacheProvider';

describe('CacheServiceConfiguration', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(),
  };

  const providerMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  it('can be created', () => {
    const configuration = new CacheServiceConfiguration(
      logger,
      directoryMock as unknown as ServiceDirectory,
      providerMock as CacheProvider,
      { targets: {} },
      tenantId
    );

    expect(configuration).toBeTruthy();
  });

  it('can handle invalid Adsp ID', () => {
    const configuration = new CacheServiceConfiguration(
      logger,
      directoryMock as unknown as ServiceDirectory,
      providerMock as CacheProvider,
      {
        targets: {
          'urn:ads:platform:file-service': {},
          'not valid': {},
        },
      },
      tenantId
    );

    expect(configuration.getTarget('urn:ads:platform:file-service')).toBeTruthy();
    expect(configuration.getTarget('not valid')).toBeFalsy();
  });

  it('can handle null configuration', () => {
    const configuration = new CacheServiceConfiguration(
      logger,
      directoryMock as unknown as ServiceDirectory,
      providerMock as CacheProvider,
      null,
      tenantId
    );

    expect(configuration).toBeTruthy();
  });

  it('can get target', () => {
    const configuration = new CacheServiceConfiguration(
      logger,
      directoryMock as unknown as ServiceDirectory,
      providerMock as CacheProvider,
      {
        targets: {
          'urn:ads:platform:file-service': {
            ttl: 300,
          },
          'urn:ads:platform:pdf-service': {},
        },
      },
      tenantId
    );

    let target = configuration.getTarget('urn:ads:platform:file-service');
    expect(target).toBeTruthy();
    expect(target.ttl).toBe(300);
    target = configuration.getTarget('urn:ads:platform:pdf-service');
    expect(target).toBeTruthy();
    expect(target.ttl).toBe(15 * 60);
    expect(configuration.getTarget('urn:ads:platform:file-service:v1')).toBeFalsy();
  });

  it('can get target with default TTL', () => {
    const configuration = new CacheServiceConfiguration(
      logger,
      directoryMock as unknown as ServiceDirectory,
      providerMock as CacheProvider,
      {
        targets: {
          'urn:ads:platform:file-service': {},
        },
      },
      tenantId
    );

    const target = configuration.getTarget('urn:ads:platform:file-service');
    expect(target).toBeTruthy();
    expect(target.ttl).toBe(15 * 60);
  });
});
