import { adspId } from '@abgov/adsp-service-sdk';
import { NamespaceEntity } from './namespace';

describe('NamespaceEntity', () => {
  const serviceMock = {
    isConnected: jest.fn(() => true),
    send: jest.fn(),
  };

  const validationMock = {
    setSchema: jest.fn(),
    validate: jest.fn(),
  };

  beforeEach(() => {
    serviceMock.send.mockReset();
    validationMock.validate.mockReset();
    validationMock.setSchema.mockReset();
  });

  it('can be created', () => {
    const entity = new NamespaceEntity(validationMock, {
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      definitions: {
        test: {
          name: 'test',
          description: '',
          payloadSchema: {},
        },
      },
    });

    expect(entity).toBeTruthy();
    expect(entity.definitions['test']).toBeTruthy();
  });

  it('can be created with null definitions', () => {
    const entity = new NamespaceEntity(validationMock, {
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      definitions: null,
    });

    expect(entity).toBeTruthy();
    expect(Object.keys(entity.definitions)).toHaveLength(0);
  });

  it('can be created with undefined definitions', () => {
    const entity = new NamespaceEntity(validationMock, {
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      definitions: undefined,
    });

    expect(entity).toBeTruthy();
    expect(Object.keys(entity.definitions)).toHaveLength(0);
  });

  it('can skip definition with invalid schema', () => {
    validationMock.setSchema.mockImplementation((key: string) => {
      if (key.includes('invalid-event')) {
        throw new Error('Invalid schema');
      }
    });

    const entity = new NamespaceEntity(validationMock, {
      tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/test`,
      name: 'test',
      definitions: {
        'valid-event': {
          name: 'valid-event',
          description: 'A valid event',
          payloadSchema: { type: 'object' },
        },
        'invalid-event': {
          name: 'invalid-event',
          description: 'An event with invalid schema',
          payloadSchema: { type: 'invalid-type' },
        },
      },
    });

    expect(entity).toBeTruthy();
    expect(entity.definitions['valid-event']).toBeTruthy();
    expect(entity.definitions['invalid-event']).toBeUndefined();
    expect(validationMock.setSchema).toHaveBeenCalledTimes(2);
  });

  it('can use tenant ID from namespace', () => {
    const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/my-tenant`;
    const entity = new NamespaceEntity(validationMock, {
      tenantId,
      name: 'test-namespace',
      definitions: {},
    });

    expect(entity.tenantId).toEqual(tenantId);
    expect(entity.name).toEqual('test-namespace');
  });

  it('can create with optional tenantId parameter', () => {
    const paramTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/param-tenant`;
    const namespaceTenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/namespace-tenant`;

    const entity = new NamespaceEntity(
      validationMock,
      {
        tenantId: namespaceTenantId,
        name: 'test',
        definitions: {},
      },
      paramTenantId
    );

    // The namespace tenantId takes precedence in the constructor
    expect(entity.tenantId).toEqual(namespaceTenantId);
  });
});
